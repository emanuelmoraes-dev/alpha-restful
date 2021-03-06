const mongoose = require('mongoose')
const { internalError, IlegallArgumentError, RuntimeError } = require('./util/exception-utility')
const { copyEntity, convertType } = require('./util/db-utility')
const { getAttr, extractValuesByArray, enumerate } = require('./util/utility')

module.exports = class Restful {
	constructor (applicationName, {
		isLocale=true,
		locale='en',
		entities={},
		patchRecursive=false,
		patchRecursiveName='patchRecursive',
		messageClientInternalError='Erro Interno! Por Favor, Contatar seu Suporte!',
		projectionName='projection',
		selectName='select',
		selectCountName='selectCount',
		limiteName='limit',
		skipName='skip',
		sortName='sort',
		Promise=require('es6-promise'),
		convertNumberToBoolean=false
	}={}) {
		Object.assign(this, {
			applicationName,
			isLocale,
			locale,
			patchRecursive,
			patchRecursiveName,
			messageClientInternalError,
			projectionName,
			selectName,
			selectCountName,
			limiteName,
			skipName,
			sortName,
			Promise,
			debug: require('debug')(applicationName + ':server'),
			convertNumberToBoolean
		})

		this.entities = {}

		for (let entityName in entities) {
			let entity = entities[entityName]
			this.add(entity)
		}
	}

	_getAttrSearchValid (attrSearch, target, descriptor, context='', type) {
		if (typeof target === 'string')
			target = { name: target }

		if (!descriptor || typeof descriptor !== 'object')
			return { target, remaining: attrSearch, attrSearch: context, end: !attrSearch, type }

		if (!attrSearch)
			return { target, remaining: attrSearch, attrSearch: context, end: !attrSearch, type }

		let attr, attrSearchArray

		if (attrSearch.match(/\./)) {
			attrSearchArray = attrSearch.split('.')
			attr = attrSearchArray[0]
		} else {
			attrSearchArray = []
			attr = attrSearch
		}

		if (target && target.sync && target.sync[attr] && target.sync[attr].dynamicData)
			return { target, attrSearch: `${context}.${attrSearch}`, end: true, type: null }

		if (attr != '_id') {
			if (!descriptor[attr] && target && target.sync && target.sync[attr]
					&& target.sync[attr].syncronized)
				return { target: target.sync[attr], remaining: attrSearchArray.slice(1).join('.'), end: !attrSearch, type,
							syncronized: target.sync[attr].syncronized }
			else if (!descriptor[attr] && target && target.sync && target.sync[attr]
					&& target.sync[attr].virtual)
				return { target: target.sync[attr], remaining: attrSearchArray.slice(1).join('.'), end: !attrSearch, virtual: true,
							find: target.sync[attr].find, limit: target.sync[attr].limit,
							skip: target.sync[attr].skip }
			else if (!descriptor[attr])
				return { target, remaining: attrSearch, attrSearch: context, end: !attrSearch, type }

			type = descriptor[attr]
		} else {
			type = null
		}

		if (type instanceof Array)
			type = type[0]

		if (target && target.sync && target.sync[attr])
			target = target.sync[attr]
		else
			target = null

		if (context)
			return this._getAttrSearchValid(attrSearchArray.slice(1).join('.'), target, type, `${context}.${attr}`, type)

		return this._getAttrSearchValid(attrSearchArray.slice(1).join('.'), target, type, attr, type)
	}

	async query (conditions, target, {
		select=null, skip=null, limit=null,
		sort=null, internalSearch=true,
		selectCount=false, isCopyEntity=false,
		findOne=false, descriptor=null
	} = {}) {

		try {
			if (!descriptor)
				descriptor = target.descriptor

			let newFind

			if (conditions instanceof Array) {
				newFind=[]
				for (let [value, index] of enumerate(conditions)) {
					newFind[index] = await this.query(value, target, {
						internalSearch: false, selectCount: false, isCopyEntity: true,
						descriptor
					})
				}
			} else {
				newFind = {}
				for (let key in conditions) {
					if (['select', 'sort', 'limit', 'skip'].indexOf(key)+1) continue
					if (['$or', '$and', '$in', '$nin'].indexOf(key)+1) {
						newFind[key] = await this.query(conditions[key], target, {
							internalSearch: false, selectCount: false, isCopyEntity: true,
							descriptor
						})

						if (key === '$and' && (!(newFind[key] instanceof Array) ||
								newFind[key].indexOf(null)+1 || !newFind[key].length)) {
							newFind = null
							break
						} else if (key !== '$and' && newFind[key] instanceof Array &&
								newFind[key].length) {
							newFind[key] = newFind[key].filter(c => c !== null)
							if (!newFind[key].length) {
								newFind = null
								break
							}
						}

						continue
					} else if (['$gt', '$gte', '$lt', '$lte', '$eq'].indexOf(key)+1) {
						newFind[key] = conditions[key]
						continue
					}

					let rt = this._getAttrSearchValid(key, target, descriptor)

					if ((!rt.target || !rt.target.name) && !rt.end)
						throw new IlegallArgumentError(`O atributo ${rt.remaining} não existe!`)

					if (!rt.end) {
						rt.target = this.entities[rt.target.name]
						rt.descriptor = this.entities[rt.target.name].descriptor
					}

					if (rt.end) {
						if (rt.syncronized || rt.virtual)
							throw new Error(`Condição de busca ${key} inválida!`)
						newFind[key] = convertType(rt.type, conditions[key], this.convertNumberToBoolean)
					} else {
						if (rt.syncronized) {
							if (rt.syncronized instanceof Array)
								rt.syncronized = rt.syncronized[0]

							if (!rt.syncronized)
								throw new Error(`O atributo 'syncronized' do 'sync' da entidade ${target.name} não deve ser um array vazio!`)

							let subConditions = {}
							subConditions[rt.remaining] = conditions[key]

							let subQuery = await this.query(subConditions, rt.target, {
								select: false, internalSearch: true, selectCount: false,
								isCopyEntity: true, descriptor: rt.descriptor
							})

							subQuery = getAttr(`${rt.syncronized}.id`, subQuery, true)
							subQuery = extractValuesByArray(subQuery, true)

							if (!(subQuery instanceof Array) || !subQuery.length) {
								newFind = null
								break
							}

							if (!newFind._id)
								newFind._id = {}

							if (!newFind._id.$in) {
								newFind._id.$in = subQuery
							} else {
								newFind._id.$in = [
									...newFind._id.$in,
									...subQuery
								]
							}
						} else if (rt.virtual) {

							rt.find = rt.find || {}

							let subConditions = {}
							subConditions[rt.remaining] = conditions[key]

							subConditions = {
								$and: [
									rt.find,
									subConditions,
								]
							}

							let subQueryCount = await this.query(subConditions, rt.target, {
								internalSearch: true, selectCount: true, limit: rt.limit,
								skip: rt.skip, descriptor: rt.descriptor
							})

							if (!subQueryCount.count) {
								newFind = null
								break
							}

						} else {

							let subConditions = {}
							subConditions[rt.remaining] = conditions[key]

							let attr = rt.remaining
							if (rt.remaining.match(/\./g))
								attr = rt.remaining.split('.')[0]

							if (rt.target && rt.target.sync && !rt.target.sync[attr] &&
							rt.descriptor && !rt.descriptor[attr])
								throw new IlegallArgumentError(`A condição de busca '${rt.remaining}' é inválida para a entidade ${rt.target.name}!`)

							let subQuery = await this.query(subConditions, rt.target, {
								select: '_id', internalSearch: true, selectCount: false,
								isCopyEntity: true, descriptor: rt.descriptor
							})
							subQuery = subQuery.map(e => e._id)

							if (!(subQuery instanceof Array) || !subQuery.length) {
								newFind = null
								break
							}

							if (!newFind[`${rt.attrSearch}.id`])
								newFind[`${rt.attrSearch}.id`] = {}

							if (!newFind[`${rt.attrSearch}.id`].$in) {
								newFind[`${rt.attrSearch}.id`].$in = subQuery
							} else {
								newFind[`${rt.attrSearch}.id`].$in = [
									...newFind[`${rt.attrSearch}.id`].$in,
									...subQuery
								]
							}
						}
					}
				}
			}

			if (!internalSearch)
				return newFind

			if (newFind === null)
				return []

			if (typeof target === 'string')
				target = { name: target }

			let entity = this.entities[target.name]
			let find, data

			if (selectCount === 'true' || selectCount === true) {
				find = entity.model.countDocuments(newFind)

				if (limit === 0 || limit)
					find = find.limit(limit)

				if (skip === 0 || skip)
					find = find.skip(skip)

				data = {
					count: await find.exec()
				}
			} else {
				if (findOne)
					find = entity.model.findOne(newFind)
				else
					find = entity.model.find(newFind)

				if (limit === 0 || limit)
					find = find.limit(limit)

				if (skip === 0 || skip)
					find = find.skip(skip)

				if (sort)
					find = find.sort(sort)

				if (select)
					find = find.select(select)

				data = await find.exec()

				if (isCopyEntity)
					data = copyEntity(data)
			}

			return data
		} catch(err) {
			console.error(err)
			throw internalError(err, this)
		}
	}

	_applySyncronized (entityName, target, field, source, nameSyncronized) {
		try {
			if (!target.syncronized)
				target.syncronized = {}

			if (nameSyncronized.match(/\./)) {
				let newNameSyncronized = nameSyncronized.split('.')[0]

				if (!target.syncronized[newNameSyncronized])
					target.syncronized[newNameSyncronized] = { attrs: [], descriptors: [] }

				nameSyncronized = nameSyncronized.split('.').slice(1).join('.')

				this._applySyncronized(entityName, target.syncronized[newNameSyncronized], field, source, nameSyncronized)
			} else {
				if (!target.syncronized[nameSyncronized])
					target.syncronized[nameSyncronized] = { attrs: [], descriptors: [] }

				target.syncronized[nameSyncronized].attrs.push(field)

				if (typeof source.sync[field] === 'object') {
					let options = {
						...source.sync[field]
					}

					delete options.sync

					target.syncronized[nameSyncronized].descriptors.push({ ...options, field })
				} else {
					target.syncronized[nameSyncronized].descriptors.push({ name: entityName, field })
				}
			}
		} catch (err) {
			throw internalError(err, this)
		}
	}

	_applySync (source, nameSyncronized) {
		try {
			for (let field in source.sync) {
				if (field === 'sync') continue

				let options = source.sync[field]

				if (typeof options === 'string')
					options = { name: options }

				if (!options.syncronized && options.name) {
					let entityName = options.name
					let subEntity = this.entities[entityName]

					if (!subEntity) {
						subEntity = { syncronized: {} }
						this.entities[entityName] = subEntity
					}

					this._applySyncronized(entityName, subEntity, field, source, nameSyncronized)
				}

				if (options.sync)
					this._applySync(options, `${nameSyncronized}.${field}`)
			}
		} catch (err) {
			throw internalError(err, this)
		}
	}

	add (entity) {
		try {
			this.debug(`registering the entity ${entity.name} ...`)

			if (this.entities[entity.name])
				Object.assign(entity, this.entities[entity.name])
			this.entities[entity.name] = entity

			this.debug(`applying relationships to the entity ${entity.name} ...`)

			this._applySync(entity, entity.name)

			this.debug(`registered entity ${entity.name}`)

		} catch (err) {
			throw internalError(err, this)
		}
	}

	_ignoreFields (data, sync, ignoreFieldsRecursive, ignoreFieldsRecursiveSubEntity) {
		try {
			if (!data || !sync) return data

			for (let attr in sync) {
				let options = sync[attr]

				if (typeof options === 'string')
					options = { name: options }

				if (!data[attr])
					continue

				if (options.jsonIgnore && data && data.hasOwnProperty(attr)) {
					delete data[attr]
					continue
				}

				if (options.sync && ignoreFieldsRecursive)
					data[attr] = this._ignoreFields(data[attr], options.sync, ignoreFieldsRecursive, ignoreFieldsRecursiveSubEntity)

				if (options.name) {
					let entityName = options.name
					let subEntity = this.entities[entityName]

					if (subEntity.sync && ignoreFieldsRecursiveSubEntity) {
						data[attr] = this._ignoreFields(data[attr], subEntity.sync, ignoreFieldsRecursive, ignoreFieldsRecursiveSubEntity)
					}
				}
			}

			return data
		} catch (err) {
			throw internalError(err, this)
		}
	}

	async _fill (data, sync, id=null, fillRec=true, {
		ignoreFillProperties=[], jsonIgnoreProperties=[],
		syncs={}
	}={}) {

		let newIgnoreFillProperties = [...ignoreFillProperties]
		let newJsonIgnoreProperties = [...jsonIgnoreProperties]
		try {
			if (!fillRec || !data || !sync) return data
			if (typeof fillRec === 'number' && fillRec > 0) fillRec--

			if (data._id && !data.id)
				data.id = data._id

			if (typeof sync === 'function')
				sync = sync(data)

			if (!sync) return data

			for (let attr in sync) {
				if (attr === 'sync') continue
				if (ignoreFillProperties.indexOf(attr)+1) continue

				let options = sync[attr]

				if (!options) continue

				if (typeof options === 'string')
					options = { name: options }

				if (options.ignoreFillProperties && options.ignoreFillProperties instanceof Array)
					newIgnoreFillProperties.push(...options.ignoreFillProperties)
				else if (options.ignoreFillProperties && typeof options.ignoreFillProperties === 'string')
					newIgnoreFillProperties.push(options.ignoreFillProperties)

				if (options.jsonIgnoreProperties && options.jsonIgnoreProperties instanceof Array)
					newJsonIgnoreProperties.push(...options.jsonIgnoreProperties)
				else if (options.jsonIgnoreProperties && typeof options.jsonIgnoreProperties === 'string')
					newJsonIgnoreProperties.push(options.jsonIgnoreProperties)

				const limit = parseInt(options.limit)
				const skip = parseInt(options.skip)
				const sort = options.sort
				let select = options.select
				let selectArray = []

				if (typeof select === 'string')
					selectArray = select.split(' ')
				else if (select instanceof Array)
					selectArray = select

				select = selectArray.join(' ')

				if (!data[attr] && !options.jsonIgnore && options.syncronized && id) {
					let attrSyncronized = options.syncronized
					if (attrSyncronized instanceof Array) {
						attrSyncronized = attrSyncronized[0]
						let subEntity = this.entities[options.name]
						let find = {}
						find[`${attrSyncronized}.id`] = id

						let query = subEntity.model.find(find).select('_id')

						if (sort)
							query = query.sort(sort)

						if (limit)
							query = query.limit(sort)

						if (skip)
							query = query.skip(skip)

						if (select)
							query = query.select(select)

						data[attr] = await query.exec()

						if (!data[attr]) continue

						data[attr] = copyEntity(data[attr])
						data[attr] = data[attr].map(d => ({ id: d._id }))
					} else {
						let subEntity = this.entities[options.name]
						let find = {}
						find[`${attrSyncronized}.id`] = id

						let query = subEntity.model.findOne(find).select('_id')

						if (sort)
							query = query.sort(sort)

						if (limit)
							query = query.limit(sort)

						if (skip)
							query = query.skip(skip)

						if (select)
							query = query.select(select)

						data[attr] = await query.exec()
						
						if (!data[attr]) continue

						data[attr] = {
							id: data[attr]._id
						}
					}
				} else if (!data[attr] && options.name && options.virtual) {
					const subEntity = this.entities[options.name]

					let find = options.find || {}

					data[attr] = await this.query(find, subEntity, {
						internalSearch: true,
						limit: options.limit,
						select: options.select,
						selectCount: options.selectCount,
						skip: options.skip,
						sort: options.sort,
						findOne: options.findOne,
						isCopyEntity: true,
						descriptor: subEntity.descriptor
					})

					if (options.selectCount !== true && options.selectCount !== 'true') {
						data[attr] = copyEntity(data[attr])
						if (data[attr]) 
							data[attr].id = data[attr]._id
					} else {
						data[attr] = data[attr].count
					}
				}

				if ((jsonIgnoreProperties.indexOf(attr)+1) || options.jsonIgnore)
					delete data[attr]

				if (!data[attr])
					continue

				let value = data[attr]

				if (value instanceof Array && value.length === 0)
					continue

				let originalIsArray = true

				if (value && !(value instanceof Array)) {
					originalIsArray = false
					value = [value]
				}

				if (!options.ignoreSubAttr && sort) {
					let attr = sort
					let order = -1

					if (attr[0] === '-') {
						attr = attr.substring(1)
						order = 1
					}

					value.sort((a, b) => {
						a = getAttr(attr, a)
						b = getAttr(attr, b)
						return a < b ? order : -order
					})
				}

				if (!options.ignoreSubAttr && skip)
					value = value.slice(skip)

				if (!options.ignoreSubAttr && limit)
					 value = value.slice(0, limit)

				let ids = []

				if (!options.virtual)
					ids = value.map(v => v.id)

				options.fillRec = options.fillRec || 0

				if (!options.jsonIgnore && jsonIgnoreProperties.indexOf(attr) === -1 &&
				!(options.fill === false && options.subFill === false) &&
				(options.fill ||
				options.subFill ||
				options.fillRec > 0 && fillRec === true ||
				options.fillRec < 0 && fillRec === true ||
				typeof(fillRec) === 'number' && fillRec > 0 ||
				typeof(fillRec) === 'number' && fillRec < 0)) {

					let subEntities = []
					let subEntity = null

					if (options.name && options.virtual) {
						subEntity = this.entities[options.name]
						subEntities = value
					} else if (!options.ignoreSubAttr && options.name && options.fill !== false) {
						subEntity = this.entities[options.name]
						subEntities = await subEntity.findByIds(ids, select, this)
						subEntities = copyEntity(subEntities)
					} else if (options.name && options.fill !== false) {
						subEntity = this.entities[options.name]

						let optionsFind = options.find

						if (optionsFind && typeof optionsFind === 'function')
							optionsFind = optionsFind(data, value)

						let query

						if (optionsFind && typeof optionsFind === 'object') {
							query = subEntity.model.find({
								$and: [{ _id: { $in: ids } }, optionsFind]
							})
						} else {
							query = subEntity.model.find({
								_id: {
									$in: ids
								}
							})
						}

						if (sort)
							query = query.sort(sort)

						if (limit)
							query = query.limit(limit)

						if (skip)
							query = query.skip(skip)

						if (select)
							query = query.select(select)

						subEntities = await query.exec()
						subEntities = copyEntity(subEntities)
					}

					let recursive = fillRec

					if (fillRec === true && options.fillRec > 0)
						recursive = options.fillRec-1
					else if (fillRec === true && options.fillRec < 0)
						recursive = options.fillRec
					else if (fillRec === true)
						recursive = false

					if (options.fill)
						recursive = recursive || 1

					if (options.subFill)
						recursive = recursive || 1

					let syncSubEntity

					if (subEntity && subEntity.sync)
						syncSubEntity = subEntity.sync

					if (subEntity && subEntity.name && syncs && syncs[subEntity.name])
						syncSubEntity = syncs[subEntity.name]

					if (options.fill !== false && !options.virtual) {
						for (let [se, index] of enumerate(subEntities))
							subEntities[index] = await this._fill(se, syncSubEntity, se._id, recursive, {
								ignoreFillProperties: newIgnoreFillProperties,
								jsonIgnoreProperties: newJsonIgnoreProperties ,
								syncs
							})
					}

					if (!options.ignoreSubAttr && options.sync && options.subFill !== false) {
						for (let [v, index] of enumerate(value)) {
							value[index] = await this._fill(v, options.sync, id, recursive, {
								ignoreFillProperties: newIgnoreFillProperties,
								jsonIgnoreProperties: newJsonIgnoreProperties,
								syncs
							})
						}
					}

					if (!options.ignoreSubAttr && selectArray.length)
						for (let v of value)
							for (let attr in v)
								if (selectArray.indexOf(attr) === -1)
									delete v[attr]

					if (!options.ignoreSubAttr && !options.virtual) {
						for (let [v, index] of enumerate(value)) {
							value[index] = {
								...(subEntities && subEntities[index] || {}),
								...v
							}
						}
					}

					if (options.ignoreSubAttr)
						value = subEntities

					if (!originalIsArray)
						value = value[0]

					data[attr] = value
				}
			}

			return data
		} catch (err) {
			throw internalError(err, this)
		}
	}

	_getConditionsBySyncronizedEntity (id, options, cmp=()=>true, path='') {
		try {
			let conditions = []

			conditions = options.descriptors.reduce((rt, descriptor) => {
				if (!cmp(descriptor, options, path))
					return rt

				let condition = {}

				if (path)
					condition[`${path}${descriptor.field}.id`] = id
				else
					condition[`${descriptor.field}.id`] = id

				return [...rt, condition]
			}, [])

			if (options.syncronized) {
				for (let subAttr in options.syncronized) {
					conditions.push(
						...this._getConditionsBySyncronizedEntity(
							id, options.syncronized[subAttr], cmp, `${path || ''}${subAttr}.`
						)
					)
				}
			}

			return conditions
		} catch (err) {
			throw internalError(err, this)
		}
	}

	async deleteSync (id, name, syncronized) {
		try {
			const entity = this.entities[name]

			if (!id || !syncronized) return

			if (entity.requiredSync) {
				for (let entityName in syncronized) {
					let options = syncronized[entityName]
					let subEntity = this.entities[entityName]

					let count = 0

					let conditions = this._getConditionsBySyncronizedEntity(id, options, descriptor=>descriptor.required)

					if (conditions.length) {
						count = await this.query({
							$or: conditions
						}, subEntity, {
							selectCount: true,
							descriptor: subEntity.descriptor
						})

						count = count.count
					}

					if (count)
						throw new IlegallArgumentError(`A entidade ${name} não pode ser removida pois está vinculada com a entidade ${entityName}!`)
				}
			}

			if (entity.deleteCascadeSync) {
				for (let entityName in syncronized) {
					let options = syncronized[entityName]
					let subEntity = this.entities[entityName]

					let entities = []

					let conditions = this._getConditionsBySyncronizedEntity(id, options, descriptor=>descriptor.deleteCascade)

					if (conditions.length) {
						entities = await this.query({
							$or: conditions
						}, subEntity)
					}

					for (let entity of entities)
						await subEntity.model.findByIdAndRemove(`${entity._id}`).exec()
				}
			}

			if (entity.verifyRelationshipSync) {
				for (let entityName in syncronized) {
					let options = syncronized[entityName]
					let subEntity = this.entities[entityName]

					let conditions = this._getConditionsBySyncronizedEntity(id, options)

					if (conditions.length) {
						let entities = await this.query({
							$or: conditions
						}, subEntity)

						entities = copyEntity(entities)

						for (let entity of entities) {
							entity = subEntity.deleteCascadeAttrs(id, options, entity)
							await subEntity.model.findByIdAndUpdate(entity._id, entity, { new: true }).exec()
						}
					}
				}
			}
		} catch (err) {
			throw internalError(err, this)
		}
	}

	async _verifyIds (data, sync, verifyIdsRec=true, {
		ignoreVerifyIdsProperties=[]
	}={}) {
		let newIgnoreVerifyIdsProperties = [...ignoreVerifyIdsProperties]
		try {
			if (!verifyIdsRec || !data || !sync) return
			if (typeof verifyIdsRec === 'number' && verifyIdsRec > 0) verifyIdsRec--

			if (typeof sync === 'function')
				sync = sync(data)

			if (!sync) return

			for (let attr in sync) {
				if (attr === 'sync') continue
				if (ignoreVerifyIdsProperties.indexOf(attr)+1) continue

				let options = sync[attr]

				if (typeof options === 'string')
					options = { name: options }

				if (!data[attr])
					continue

				if (options.ignoreVerifyIdsProperties && options.ignoreVerifyIdsProperties instanceof Array)
					newIgnoreVerifyIdsProperties.push(...options.ignoreVerifyIdsProperties)
				else if (options.ignoreVerifyIdsProperties && typeof options.ignoreVerifyIdsProperties === 'string')
					newIgnoreVerifyIdsProperties.push(options.ignoreVerifyIdsProperties)

				let value = data[attr]

				if (value instanceof Array && value.length === 0)
					continue

				if (!(value instanceof Array))
					value = [value]

				if (options.virtual)
					continue

				let ids = value.map(v => v.id)

				options.verifyIdsRec = options.verifyIdsRec || 0

				if (options.verifyIds !== false &&
				(options.verifyIds ||
				options.verifyIdsRec > 0 && verifyIdsRec === true ||
				options.verifyIdsRec < 0 && verifyIdsRec === true ||
				typeof(verifyIdsRec) === 'number' && verifyIdsRec > 0 ||
				typeof(verifyIdsRec) === 'number' && verifyIdsRec < 0)) {

					let subEntity = null

					if (options.name) {
						subEntity = this.entities[options.name]
						let invalid = await subEntity.existsInvalidIds(ids, this)

						if (invalid)
							throw new IlegallArgumentError(`O id ${invalid} não está registrado na entidade ${options.name}`)
					}

					let recursive = verifyIdsRec

					if (verifyIdsRec === true && options.verifyIdsRec > 0)
						recursive = options.verifyIdsRec-1
					else if (verifyIdsRec === true && options.verifyIdsRec < 0)
						recursive = options.verifyIdsRec
					else if (verifyIdsRec === true)
						recursive = false

					if (options.verifyIds)
						recursive = recursive || 1

					for (let [v, index] of enumerate(value))
						if (options.sync)
							await this._verifyIds(v, options.sync, recursive, {
								ignoreVerifyIdsProperties: newIgnoreVerifyIdsProperties
							})
				}
			}
		} catch (err) {
			throw internalError(err, this)
		}
	}

	structDb () {
		try {
			for (let entityName in this.entities) {
				let entity = this.entities[entityName]
				entity.schema = new mongoose.Schema(entity.descriptor)
				entity.model = mongoose.model(entityName, entity.schema, entity.resource)

				if (this.isLocale) {
					let find = entity.model.find.bind(entity.model)
					let that = this
					entity.model.find = function () {
						const args = Array.prototype.slice.call(arguments)
						return find(...args).collation({ 'locale': that.locale })
					}
				}
			}
		} catch (err) {
			throw internalError(err, this)
		}
	}

	applyRouters (app) {
		if (!app) return

		for (let entityName in this.entities) {
			let entity = this.entities[entityName]
			if (!entity.name)
				throw new RuntimeError(`Entidade ${entityName} não existe!`)

			this.debug(`defining default routes for the entity ${entity.name} ...`)

			entity.applyRouters(app, this)

			this.debug(`standard routes of the defined entity ${entity.name}`)
		}
	}

	execAsync () {
		try {
			let fsAsync, autoSendStatus

			fsAsync = Array.prototype.slice.call(arguments)

			if (!fsAsync.length)
				return []

			const last = fsAsync[fsAsync.length-1]

			if (typeof fsAsync[0] === 'boolean' || typeof fsAsync[0] === 'number') {
				fsAsync = fsAsync.slice(1)
				autoSendStatus = fsAsync[0]
			} else if (typeof last === 'boolean' || typeof last === 'number') {
				fsAsync = fsAsync.slice(0, fsAsync.length - 1)
				autoSendStatus = last
			} else {
				autoSendStatus = false
			}

			if (autoSendStatus === true)
				autoSendStatus = 200

			if (autoSendStatus) {
				fsAsync.push((req, res, next) => {
					res.status(autoSendStatus).send(res._content_)
				})
			}

			return fsAsync.map((fAsync, index) => (req, res, next) => {
				this.Promise.resolve(fAsync(req, res, next)).catch(err => {
					next(internalError(err, this))
				})
			})
		} catch (err) {
			throw internalError(err, this)
		}
	}
}
