const mongoose = require('mongoose')
const { internalError, IlegallArgumentError, RuntimeError } = require('./util/exception-utility')
const { copyEntity, convertType } = require('./util/db-utility')
const { getAttr, extractValuesByArray } = require('./util/utility')

module.exports = class Restful {
    constructor ({
        isLocale=true,
        locale='pt',
        entities={},
        patchRecursive=true,
        patchRecursiveName='patchRecursive',
        messageClientInternalError='Erro Interno! Por Favor, Contatar seu Suporte!',
        projectionName='projection',
        selectName='select',
        selectCountName='selectCount',
        limiteName='limit',
        skipName='skip',
        sortName='sort'
    }={}) {
        Object.assign(this, {
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
            sortName
        })

        this.entities = {}

        for (let entityName in entities) {
            let entity = entities[entityName]
            this.add(entity)
        }
    }

    getAttrSearchValid (attrSearch, targetSync, descriptor, context='', type) {
        if (typeof targetSync === 'string')
            targetSync = { name: targetSync }

        if (!descriptor || typeof descriptor !== 'object')
            return { targetSync, remaining: attrSearch, attrSearch: context, end: !attrSearch, type }

        if (!attrSearch)
            return { targetSync, remaining: attrSearch, attrSearch: context, end: !attrSearch, type }

        let attr, attrSearchArray

        if (attrSearch.match(/\./)) {
            attrSearchArray = attrSearch.split('.')
            attr = attrSearchArray[0]
        } else {
            attrSearchArray = []
            attr = attrSearch
        }

        if (!descriptor[attr] && targetSync && targetSync.sync && targetSync.sync[attr] 
                && targetSync.sync[attr].syncronized)
            return { targetSync: targetSync.sync[attr], remaining: attrSearchArray.slice(1).join('.'), end: !attrSearch, type, 
                        syncronized: targetSync.sync[attr].syncronized }
        else if (!descriptor[attr])
            return { targetSync, remaining: attrSearch, attrSearch: context, end: !attrSearch, type }

        type = descriptor[attr]

        if (type instanceof Array)
            type = type[0]

        if (targetSync && targetSync.sync && targetSync.sync[attr])
            targetSync = targetSync.sync[attr]
        else
            targetSync = null

        if (context)
            return this.getAttrSearchValid(attrSearchArray.slice(1).join('.'), targetSync, type, `${context}.${attr}`, type)

        return this.getAttrSearchValid(attrSearchArray.slice(1).join('.'), targetSync, type, attr, type)
    }

    async query (conditions, targetSync, descriptor, select, internalSearch=true) {
        let newFind

        if (conditions instanceof Array) {
            newFind=[]
            for (let [value, index] of enumerate(conditions))
                newFind[index] = await this.query(value, targetSync, descriptor, select, false)
        } else {
            newFind = {}
            for (let key in conditions) {
                if (['$or', '$and', '$in', '$gt', '$gte', '$lt', '$leq', '$eq'].indexOf(key)+1) {
                    newFind[key] = await this.query(conditions[key], targetSync, descriptor, select, false)
                    continue
                }

                let rt = this.getAttrSearchValid(key, targetSync, descriptor)

                if ((!rt.targetSync || !rt.targetSync.name) && !rt.end)
                    throw new IlegallArgumentError(`O atributo ${rt.remaining} não existe!`)

                if (!rt.end) {
                    rt.targetSync = this.entities[rt.targetSync.name]
                    rt.descriptor = this.entities[rt.targetSync.name].descriptor
                }
                
                if (rt.end) {
                    if (rt.syncronized)
                        throw new Error(`Condição de busca ${key} inválida!`)
                    newFind[key] = convertType(rt.type, conditions[key])
                } else {
                    if (rt.syncronized) {
                        if (rt.syncronized instanceof Array)
                            rt.syncronized = rt.syncronized[0]

                        if (!rt.syncronized)
                            throw new Error(`O atributo 'syncronized' do 'sync' da entidade ${targetSync.name} não deve ser um array vazio!`)

                        let subConditions = {}
                        subConditions[rt.remaining] = conditions[key]

                        if (!newFind._id)
                            newFind._id = {}

                        let subQuery = await this.query(subConditions, rt.targetSync, rt.descriptor, false, true)
                        subQuery = getAttr(`${rt.syncronized}.id`, subQuery, true)
                        subQuery = extractValuesByArray(subQuery, true)

                        if (!newFind._id.$in) {
                            newFind._id.$in = subQuery
                        } else {
                            newFind._id.$in = {
                                ...newFind._id.$in,
                                ...subQuery
                            }
                        }
                    } else {
                        let subConditions = {}
                        subConditions[rt.remaining] = conditions[key]

                        if (!newFind[`${rt.attrSearch}.id`])
                            newFind[`${rt.attrSearch}.id`] = {}

                        let subQuery = await this.query(subConditions, rt.targetSync, rt.descriptor, '_id', true)
                        subQuery = subQuery.map(e => e._id)

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

            if (!internalSearch)
                return newFind

            if (typeof targetSync === 'string')
                targetSync = { name: targetSync }

            let entity = this.entities[targetSync.name]

            let find = entity.model.find(newFind)

            if (select)
                find = find.select(select)

            return copyEntity(await find.exec())
        }
    }

    syncronized (entityName, target, field, source, nameSyncronized) {
        try {
            if (!target.syncronized)
                target.syncronized = {}

            if (nameSyncronized.match(/\./)) {
                let newNameSyncronized = nameSyncronized.split('.')[0]

                if (!target.syncronized[newNameSyncronized])
                    target.syncronized[newNameSyncronized] = { attrs: [], descriptors: [] }

                nameSyncronized = nameSyncronized.split('.').slice(1).join('.')

                this.syncronized(entityName, target.syncronized[newNameSyncronized], field, source, nameSyncronized)
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

    sync (source, nameSyncronized) {
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

                    this.syncronized(entityName, subEntity, field, source, nameSyncronized)
                }

                if (options.sync)
                    this.sync(options, `${nameSyncronized}.${field}`)
            }
        } catch (err) {
            throw internalError(err, this)
        }
    }

    add (entity) {
        try {
            if (this.entities[entity.name])
                Object.assign(entity, this.entities[entity.name])
            this.entities[entity.name] = entity
            this.sync(entity, entity.name)
        } catch (err) {
            throw internalError(err, this)
        }
    }

    ignoreFields (data, sync, ignoreFieldsRecursive, ignoreFieldsRecursiveSubEntity) {
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
                    data[attr] = this.ignoreFields(data[attr], options.sync, ignoreFieldsRecursive, ignoreFieldsRecursiveSubEntity)
                
                if (options.name) {
                    let entityName = options.name
                    let subEntity = this.entities[entityName]
                    
                    if (subEntity.sync && ignoreFieldsRecursiveSubEntity) {
                        data[attr] = this.ignoreFields(data[attr], subEntity.sync, ignoreFieldsRecursive, ignoreFieldsRecursiveSubEntity)
                    }
                }
            }

            return data
        } catch (err) {
            throw internalError(err, this)
        }
    }

    async fill (data, sync, id=null, rec=true, ignoreFillProperties=[], jsonIgnoreProperties=[]) {
        let newIgnoreFillProperties = [...ignoreFillProperties]
        let newJsonIgnoreProperties = [...jsonIgnoreProperties]
        try {
            if (!rec || !data || !sync) return data
            if (typeof rec === 'number' && rec > 0) rec--

            if (data._id && !data.id)
                data.id = data._id

            for (let attr in sync) {
                if (attr === 'sync') continue
                if (ignoreFillProperties.indexOf(attr)+1) continue

                let options = sync[attr]

                if (typeof options === 'string')
                    options = { name: options }

                if (!data[attr] && !options.jsonIgnore && options.syncronized && id) {
                    let attrSyncronized = options.syncronized
                    if (attrSyncronized instanceof Array) {
                        attrSyncronized = attrSyncronized[0]
                        let subEntity = this.entities[options.name]
                        let find = {}
                        find[`${attrSyncronized}.id`] = id
                        data[attr] = await subEntity.model.find(find).select('_id').exec()
                        data[attr] = copyEntity(data[attr])
                        data[attr] = data[attr].map(d => ({ id: d._id }))
                    } else {
                        let subEntity = this.entities[options.name]
                        let find = {}
                        find[`${attrSyncronized}.id`] = id
                        data[attr] = await subEntity.model.findOne(find).select('_id').exec()
                        data[attr] = {
                            id: copyEntity(data[attr])._id
                        }
                    }
                } else if (!data[attr]) {
                    continue
                }

                if (options.ignoreFillProperties && options.ignoreFillProperties instanceof Array)
                    newIgnoreFillProperties.push(...options.ignoreFillProperties)
                else if (options.ignoreFillProperties && typeof options.ignoreFillProperties === 'string')
                    newIgnoreFillProperties.push(options.ignoreFillProperties)

                if (options.jsonIgnoreProperties && options.jsonIgnoreProperties instanceof Array)
                    newJsonIgnoreProperties.push(...options.jsonIgnoreProperties)
                else if (options.jsonIgnoreProperties && typeof options.jsonIgnoreProperties === 'string')
                    newJsonIgnoreProperties.push(options.jsonIgnoreProperties)
                
                let value = data[attr]
                
                if (value instanceof Array && value.length === 0)
                    continue

                let originalIsArray = true

                if (!(value instanceof Array)) {
                    originalIsArray = false
                    value = [value]
                }

                let ids = value.map(v => v.id)

                options.rec = options.rec || 0

                if (!options.jsonIgnore && jsonIgnoreProperties.indexOf(attr) === -1 &&
                options.fill !== false && 
                (options.fill ||
                options.rec > 0 && rec === true || 
                options.rec < 0 && rec === true ||
                typeof(rec) === 'number' && rec > 0 || 
                typeof(rec) === 'number' && rec < 0)) {

                    let subEntities = []
                    let subEntity = null

                    if (options.name) {
                        subEntity = this.entities[options.name]
                        subEntities = await subEntity.findByIds(ids, this)
                        subEntities = copyEntity(subEntities)
                    }

                    let recursive = rec
                    
                    if (rec === true && options.rec > 0)
                        recursive = options.rec-1
                    else if (rec === true && options.rec < 0)
                        recursive = options.rec
                    else if (rec === true)
                        recursive = false
                        
                    if (options.fill)
                        recursive = recursive || 1
                    
                    for (let [se, index] of enumerate(subEntities))
                        subEntities[index] = await this.fill(se, subEntity.sync, se._id, recursive, newIgnoreFillProperties, newJsonIgnoreProperties)

                    for (let [v, index] of enumerate(value))
                        if (options.sync)
                            value[index] = await this.fill(v, options.sync, id, recursive, newIgnoreFillProperties, newJsonIgnoreProperties)

                    for (let [v, index] of enumerate(value)) {
                        value[index] = {
                            ...(subEntities && subEntities[index] || {}),
                            ...v,
                            $init: undefined
                        }
                    }
                }

                if (!originalIsArray)
                    value = value[0]

                data[attr] = value

                if (jsonIgnoreProperties.indexOf(attr)+1)
                    delete data[attr]
            }

            return data
        } catch (err) {
            throw internalError(err, this)
        }
    }

    getConditionsBySyncronizedEntity (id, options, cmp=()=>true, path='') {
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
                        ...this.getConditionsBySyncronizedEntity(
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
            if (!id || !syncronized) return

            for (let entityName in syncronized) {
                let options = syncronized[entityName]
                let subEntity = this.entities[entityName]

                let count = 0

                let conditions = this.getConditionsBySyncronizedEntity(id, options, descriptor=>descriptor.required)

                if (conditions.length) {
                    count = await subEntity.model.count({
                        $or: conditions
                    }).exec()
                }
                
                if (count)
                    throw new IlegallArgumentError(`A entidade ${name} não pode ser removida pois está vinculada com a entidade ${entityName}!`)
            }

            for (let entityName in syncronized) {
                let options = syncronized[entityName]
                let subEntity = this.entities[entityName]

                let entities = []

                let conditions = this.getConditionsBySyncronizedEntity(id, options, descriptor=>descriptor.deleteCascade)

                if (conditions.length) {
                    entities = await subEntity.model.find({
                        $or: conditions
                    }).exec()
                }

                for (let entity of entities)
                    await subEntity.model.findByIdAndRemove(`${entity.id}`).exec()
            }

            for (let entityName in syncronized) {
                let options = syncronized[entityName]
                let subEntity = this.entities[entityName]
                
                let conditions = this.getConditionsBySyncronizedEntity(id, options)
                
                if (conditions.length) {
                    let entities = await subEntity.model.find({
                        $or: conditions
                    }).exec()
                    
                    entities = copyEntity(entities)

                    for (let entity of entities) {
                        entity = subEntity.deleteCascadeAttrs(id, options, entity)
                        await subEntity.model.findByIdAndUpdate(entity._id, entity, { new: true }).exec()
                    }
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
                entity.model = mongoose.model(entityName, entity.schema)

                if (this.isLocale) {
                    let find = entity.model.find.bind(entity.model)
                    let that = this
                    entity.model.find = function () {
                        return find(...arguments).collation({ 'locale': that.locale })
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
            entity.applyRouters(app, this)
        }
    }

    execAsync () {
        try {
            let fsAsync, autoSendStatus
    
            fsAsync = Array.prototype.slice.call(arguments)
    
            if (typeof fsAsync[0] === 'boolean' || typeof fsAsync[0] === 'number') {
                fsAsync = fsAsync.slice(1)
                autoSendStatus = fsAsync[0]
            } else if (typeof fsAsync.last() === 'boolean' || typeof fsAsync.last() === 'number') {
                fsAsync = fsAsync.slice(0, fsAsync.length - 1)
                autoSendStatus = fsAsync.last()
            } else {
                autoSendStatus = false
            }
    
            return fsAsync.map((fAsync, index) => function (req, res, next) {
                Promise.resolve(fAsync(req, res, next))
                    .then(() => {
                        if (index == fsAsync.length - 1) {
                            if (autoSendStatus && typeof autoSendStatus === 'number')
                                res.status(autoSendStatus).send(res._content_)
                            else if (autoSendStatus)
                                res.status(200).send(res._content_)
                        }
                        else {
                            next()
                        }
                    })
                    .catch(err => { 
                        next(internalError(err, this))
                    })
            })
        } catch (err) {
            throw internalError(err, this)
        }
    }
}
