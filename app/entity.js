const { internalError, IlegallArgumentError, RuntimeError } = require('./util/exception-utility')
const { copyEntity, prepareEntity, patchUpdate } = require('./util/db-utility')
const { enumerate } = require('./util/utility')
const mongoose = require('mongoose')

module.exports = class Entity {
	constructor ({
		name,
		resource,
		descriptor,
		sync={},
		projections={},
		projectionDefault=null,
		methods=[],
		ignoreFieldsRecursiveSubEntity=false,
		ignoreFieldsRecursive=false,
		removeSync=true,
		querySync=true,
		fillSync=true,
		verifyIdsSync=false,
		verifyRelationshipSync=true,
		deleteCascadeSync=true,
		requiredSync=true,
		relationshipQueryDefault=true
	}={}) {
		Object.assign(this, {
			name,
			resource,
			descriptor,
			sync,
			projections,
			projectionDefault,
			methods,
			ignoreFieldsRecursiveSubEntity,
			ignoreFieldsRecursive,
			removeSync,
			querySync,
			fillSync,
			verifyIdsSync,
			verifyRelationshipSync,
			deleteCascadeSync,
			requiredSync,
			relationshipQueryDefault
		})

		if (this.resource && this.resource[0] === '/')
			this.resource = this.resource.substring(1)

		this.syncronized = {}
		this.schema = null
		this.model = null
	}

	parseAsyncProjection(fn, restful) {
		return async function () {
			const args = Array.prototype.slice.call(arguments)
			return await new restful.Promise((resolve, reject) => {
				try {
					restful.Promise.resolve(fn(...args, resolve, reject)).catch(err => {
						reject(err)
					})
				} catch (err) {
					reject(err)
				}
			})
		}
	}

	getRouteHandler(handlerName) {
		if (['beforeQuery', 'afterQuery', 'beforeCreate', 'afterCreate',
		'beforeRemove', 'afterRemove', 'beforeEdit', 'afterEdit'].indexOf(handlerName) == -1)
			throw new Error(`Handler ${handlerName} Inválido!`)

		const parseEntity = handlerName !== 'beforeQuery'

		if (parseEntity)
			return (req, res, next) => this[handlerName](res._content_, req, res, next)
		else
			return (req, res, next) => this[handlerName](req, res, next)
	}

	applyRouters (app, restful) {
		if (!app) return

		if (this.methods.indexOf('get')+1) {
			app.get(`/${this.resource}/:id`, this.findOneRouter(restful))
			app.get(`/${this.resource}`, this.getRouter(restful))
		}

		if (this.methods.indexOf('post')+1)
			app.post(`/${this.resource}`, this.postRouter(restful))

		if (this.methods.indexOf('put')+1)
			app.put(`/${this.resource}/:id`, this.putRouter(restful))

		if (this.methods.indexOf('delete')+1)
			app.delete(`/${this.resource}/:id`, this.deleteRouter(restful))

		if (this.methods.indexOf('patch')+1)
			app.patch(`/${this.resource}/:id`, this.patchRouter(restful))
	}

	findOneRouter (restful) {
		let that = this
		return restful.execAsync(
			async function (req, res, next) {
				if (!mongoose.Types.ObjectId.isValid(req.params.id))
					next('route')
				else
					next()
			},
			this.getRouteHandler('beforeQuery'),
			async function (req, res, next) {
				res._content_ = await that.model.findOne({ _id: req.params.id }).exec()
				if (!res._content_)
					throw new IlegallArgumentError('Id Inválido!', `Entidade ${this.name} não possui este id`)
				next()
				// res._content_ = copyEntity(res._content_)
			},
			this.afterGetFill(restful),
			this.afterGetProjections(restful),
			this.getRouteHandler('afterQuery'),
			async function (req, res, next) {
				res.status(200).send(res._content_)
			}
		)
	}

	getRouter (restful) {
		if (this.methods.indexOf('get') === -1)
			return

		return restful.execAsync(
			this.getRouteHandler('beforeQuery'),
			this.getQuery(restful),
			this.afterGetFill(restful),
			this.afterGetProjections(restful),
			this.getRouteHandler('afterQuery'),
			async function (req, res, next) {
				res.status(200).send(res._content_)
			}
		)
	}

	postRouter (restful) {
		if (this.methods.indexOf('post') === -1)
			return

		const that = this
		return restful.execAsync(
			async function (req, res, next) {
				// req.body = prepareEntity(req.body, that.descriptor)
				res._content_ = new that.model(req.body)
				next()
			},
			this.getRouteHandler('beforeCreate'),
			async function (req, res, next) {
				await res._content_.save()
				next()
			},
			this.getRouteHandler('afterCreate'),
			async function (req, res, next) {
				res.status(201).send(res._content_)
			}
		)
	}

	putRouter (restful) {
		if (this.methods.indexOf('put') === -1)
			return

		const that = this
		return restful.execAsync(
			async function (req, res, next) {
				// req.body = prepareEntity(req.body, that.descriptor)
				req.body._id = req.params.id
				res._content_ = req.body
				next()
			},
			this.getRouteHandler('beforeEdit'),
			this.beforeCreateAndEditVerifyIds(restful),
			async function (req, res, next) {
				that.model.findByIdAndUpdate(
					req.params.id,
					res._content_,
					{new: true},
					(err, todo) => {
						if (err) return next(internalError(err, restful))
						res._content_ = todo
						next()
					}
				)
			},
			this.getRouteHandler('afterEdit'),
			async function (req, res, next) {
				res.status(200).send(res._content_)
			}
		)
	}

	deleteRouter (restful) {
		if (this.methods.indexOf('delete') === -1)
			return

		const that = this
		return restful.execAsync(
			async function (req, res, next) {
				res._content_ = await that.model.findOne({ _id: req.params.id }).exec()
				next()
			},
			this.getRouteHandler('beforeRemove'),
			this.beforeDeleteSync(restful),
			async function (req, res, next) {
				await res._content_.remove()
				next()
			},
			this.getRouteHandler('afterRemove'),
			async function (req, res, next) {
				res.status(204).end()
			}
		)
	}

	patchRouter (restful) {
		if (this.methods.indexOf('patch') === -1)
			return

		const that = this
		return restful.execAsync(
			async function (req, res, next) {
				const id = req.params.id
				req.body._id = id

				let content = await that.model.findOne({ _id: id }).exec()

				content = copyEntity(content)
				// req.body = prepareEntity(req.body, that.descriptor)
				if ((req.query[restful.patchRecursiveName] == 'true'  || restful.patchRecursive)
						&& req.query[restful.patchRecursiveName] != 'false')
					content = patchUpdate(content, req.body)
				else
					content = {
						...content,
						...req.body
					}

				res._content_ = content

				next()
			},
			this.getRouteHandler('beforeEdit'),
			this.beforeCreateAndEditVerifyIds(restful),
			async function (req, res, next) {
				that.model.findByIdAndUpdate(
					req.params.id,
					res._content_,
					{new: true},
					(err, todo) => {
						if (err) return next(internalError(err, restful))
						res._content_ = todo
						next()
					}
				)
			},
			this.getRouteHandler('afterEdit'),
			async function (req, res, next) {
				res.status(200).send(res._content_)
			}
		)
	}

	async _query (find, restful) {
		let select = null

		if (find[restful.selectName]) {
			select = find[restful.selectName]
			select = select.split(/[,./\\; -+_]+/g).join(' ')
		}

		let limit = parseInt(find[restful.limiteName])
		let skip = parseInt(find[restful.skipName])
		let sort

		if (find[restful.sortName])
			sort = find[restful.sortName]

		let newFind = { $and: [] }

		if (this.querySync) {
			for (let key in find) {
				if ([
				restful.selectCountName, restful.selectName,
				restful.limiteName, restful.skipName,
				restful.sortName, restful.projectionName
				].indexOf(key)+1) continue

				if (key.endsWith('__regex')) {
					let value = find[key]
					key = key.split('__regex')[0]
					let regexp = value.split('/')
					regexp = new RegExp(regexp[1], regexp[2])

					let condition = {}
					condition[key] = regexp

					newFind.$and.push(condition)

				} else if (key.match(/__/)) {
					let keyArray = key.split(/__/)
					if (['$gt', '$gte', '$lt', '$lte', '$eq'].indexOf(keyArray[1])+1) {

						let condition = {}
						condition[keyArray[0]] = {}
						condition[keyArray[0]][keyArray[1]] = find[key]

						newFind.$and.push(condition)

					} else if (['$in', '$nin'].indexOf(keyArray[1])+1) {

						let value = find[key].split(',')

						let condition = {}
						condition[keyArray[0]] = {}
						condition[keyArray[0]][keyArray[1]] = value

						newFind.$and.push(condition)

					} else {
						let condition = {}
						condition[key] = find[key]

						newFind.$and.push(condition)
					}
				} else {
					let condition = {}
					condition[key] = find[key]

					newFind.$and.push(condition)
				}
			}
		}

		if (!newFind.$and || !(newFind.$and instanceof Array) || !newFind.$and.length)
			delete newFind.$and

		if (this.relationshipQueryDefault) {
			if (find[restful.selectCountName] === 'true' || find[restful.selectCountName] === true) {
				return await restful.query(newFind, this, {
					limit, skip, selectCount: true, internalSearch: true,
					descriptor: this.descriptor
				})
			} else {
				return await restful.query(newFind, this, {
					limit, skip, sort, select, internalSearch: true,
					descriptor: this.descriptor
				})
			}
		} else {
			if (find[restful.selectCountName] === 'true' || find[restful.selectCountName] === true) {
				let query = this.model.countDocuments(newFind)

				if (limit >= 0)
					query = query.limit(limit)

				if (skip >= 0)
					query = query.skip(skip)

				return {
					count: await query.exec()
				}
			} else {
				let query = this.model.find(newFind)

				if (limit >= 0)
					query = query.limit(limit)

				if (skip >= 0)
					query = query.skip(skip)

				if (sort)
					query = query.sort(sort)

				return await query.exec()
			}
		}
	}

	getQuery (restful) {
		const that = this
		return async function (req, res, next) {
			res._content_ = await that._query(req.query, restful)
			next()
		}
	}

	async existsInvalidIds (ids, restful) {
		try {
			for (let id of ids) {

				if (!id)
					throw new IlegallArgumentError(`Erro! id vazio.`)

				let count = await this.model.countDocuments({
					_id: id
				}).exec()

				if (!count)
					return id
			}
			return false
		} catch (err) {
			throw internalError(err, restful)
		}
	}

	async findByIds (ids, restful) {
		try {
			let data = []
			for (let id of ids) {
				let d = await this.model.findOne({
					_id: id
				}).exec()

				// d = copyEntity(d)

				if (d) data.push(d)
			}
			return data
		} catch (err) {
			throw internalError(err, restful)
		}
	}

	async fill (content, restful, {
		ignoreFillProperties=[], jsonIgnoreProperties=[],
		sync=null, syncs={}
	}={}) {
		try {
			sync = sync || this.sync

			let isOriginalArray = true

			if (!content)
				return content

			if (!(content instanceof Array)) {
				isOriginalArray = false
				content = [content]
			}

			for (let { value, index } of enumerate(content)) {
				if (!value)
					continue

				value = copyEntity(value)
				content[index] = await restful._fill(value, sync, value._id, true, {
					ignoreFillProperties, jsonIgnoreProperties,
					syncs
				})
				content[index] = restful._ignoreFields(value, this.sync,
					this.ignoreFieldsRecursive, this.ignoreFieldsRecursiveSubEntity)
			}

			if (!isOriginalArray)
				return content[0]
			return content
		} catch (err) {
			throw internalError(err, restful)
		}
	}

	afterGetFill (restful) {
		const that = this
		return async function (req, res, next) {
			if (that.fillSync
			&& req.query.selectCount !== true && req.query.selectCount !== 'true')
				res._content_ = await that.fill(res._content_, restful)
			next()
		}
	}

	async parseFromProjection(projection, content, restful) {
		if (typeof projection === 'function') {
			projection = this.parseAsyncProjection(projection, restful)
			return await projection(content)
		} else if (projection instanceof Array) {
			for (let key of Object.keys(content)) {
				if (!(projection.indexOf(key) + 1))
					delete content[key]
			}
			return content
		} else if (typeof projection === 'object') {
			let anterior = {}

			for (let key of Object.keys(projection)) {
				anterior[key] = await restful.Promise.resolve(projection[key](content, content[key]))
			}

			return anterior
		} else {
			throw new RuntimeError(`Projeção ${projectionName} Inválida`)
		}
	}

	async applyProjections (content, projectionName, restful) {
		try {
			if (!projectionName) {
				if (!this.projectionDefault) return content
				projectionName = this.projectionDefault
			}

			let projection = this.projections[projectionName]

			if (!projection)
				throw new IlegallArgumentError(`Projeção ${projectionName} não encontrada`)

			if (content instanceof Array) {
				for (let [entity, i] of enumerate(content)) {
					entity = copyEntity(entity)
					content[i] = await this.parseFromProjection(projection, entity, restful)
				}
			} else {
				content = copyEntity(content)
				content = await this.parseFromProjection(projection, content, restful)
			}

			return content
		} catch (err) {
			throw internalError(err, restful)
		}
	}

	afterGetProjections(restful) {
		const that = this
		return async function (req, res, next) {
			if (req.query.selectCount !== true && req.query.selectCount !== 'true')
				res._content_ = await that.applyProjections(res._content_, req.query[restful.projectionName], restful)
			next()
		}
	}

	beforeDeleteSync (restful) {
		const that = this
		return async function (req, res, next) {
			if (that.removeSync)
				await restful.deleteSync(req.params.id, that.name, that.syncronized)
			next()
		}
	}

	deleteCascadeAttrs (subEntityId, options, target) {

		for (let descriptor of options.descriptors) {

			if (descriptor.ignoreVerifyRelationship)
				continue

			let field = descriptor.field

			if (target[field] === undefined || target[field] === null)
				continue
			if (target[field] instanceof Array && target[field].length) {
				target[field] = target[field].filter(it => it.id != subEntityId)
			} else {
				target[field] = target[field].id == subEntityId ? null : target[field]
			}
		}

		if (options.syncronized) {
			for (let attr in options.syncronized) {
				let optionsAttr = options.syncronized[attr]
				target[attr] = this.deleteCascadeAttrs(subEntityId, optionsAttr, target[attr])
			}
		}

		return target
	}

	async verifyIds (content, restful) {
		try {
			if (!content)
				return

			if (!(content instanceof Array))
				content = [content]

			for (let { value, index } of enumerate(content)) {
				if (!value)
					continue

				// value = copyEntity(value)
				await restful._verifyIds(value, this.sync)
			}
		} catch (err) {
			throw internalError(err, restful)
		}
	}

	beforeCreateAndEditVerifyIds (restful) {
		const that = this
		return async function (req, res, next) {
			if (that.verifyIdsSync)
				await that.verifyIds(res._content_, restful)
			next()
		}
	}

	async beforeQuery (req, res, next){ next() }
	async afterQuery (entity, req, res, next){ next() }

	async beforeCreate (entity, req, res, next){ next() }
	async afterCreate (entity, req, res, next){ next() }

	async beforeRemove (entity, req, res, next){ next() }
	async afterRemove (entity, req, res, next){ next() }

	async beforeEdit (entity, req, res, next){ next() }
	async afterEdit (entity, req, res, next){ next() }
}
