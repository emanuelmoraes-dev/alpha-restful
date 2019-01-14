const mongoose = require('mongoose')
const { internalError } = require('./util/exception-utility')

module.exports = class Restful {
    constructor ({
        isLocale=true,
        locale='pt',
        entities={}
    }={}) {
        Object.assign(this, {
            isLocale, 
            locale
        })

        this.entities = {}

        for (let entityName in entities) {
            let entity = entities[entityName]
            this.add(entity)
        }
    }

    getAttrSearchValid (attrSearch, targetSync, descriptor, descriptorContext, context='') {
        if (!descriptorContext)
            descriptorContext = descriptor

        if (!descriptor || typeof descriptor !== 'object')
            return { sync: targetSync, remaining: attrSearch, attrSearch: context, descriptor: descriptorContext, end: !attrSearch }

        if (!attrSearch || !targetSync.sync)
            return { sync: targetSync, remaining: attrSearch, attrSearch: context, descriptor: descriptorContext, end: !attrSearch }

        let attr, attrSearchArray

        if (attrSearch.match(/\./)) {
            attrSearchArray = attrSearch.split('.')
            attr = attrSearchArray[0]
        } else {
            attrSearchArray = []
            attr = attrSearch
        }

        if (!descriptor[attr] || !targetSync.sync[attr])
            return { sync: targetSync, remaining: attrSearch, attrSearch: context, descriptor: descriptorContext, end: !attrSearch }

        if (context)
            return this.getAttrSearchValid(attrSearchArray.slice(1).join('.'), targetSync.sync[attr], descriptor[attr], descriptor, `${context}.${attr}`)

        return this.getAttrSearchValid(attrSearchArray.slice(1).join('.'), targetSync.sync[attr], descriptor[attr], descriptor, attr)
    }

    async query (conditions, targetSync, descriptor, select) {
        let newFind

        if (conditions instanceof Array) {
            newFind=[]
            for (let [value, index] of enumerate(conditions))
                newFind[index] = await this.query(value, targetSync, descriptor, select)
            return newFind
        } else {
            newFind = {}
            for (let key in conditions) {
                if (key === '$or' || key === '$and') {
                    newFind[key] = await this.query(conditions[key], targetSync, descriptor, select)
                    continue
                }

                let rt = this.getAttrSearchValid(key, targetSync, descriptor)
                
                if (rt.end) {
                    newFind[key] = conditions[key]
                } else {
                    let subConditions = {}
                    subConditions[rt.remaining] = conditions[key]
                    newFind[`${rt.attrSearch}.id`] = {
                        $in: await this.query(subConditions, rt.sync, rt.descriptor, 'id')
                    }
                    newFind[`${rt.attrSearch}.id`].$in = newFind[`${rt.attrSearch}.id`].$in.map(e => e._id)
                }
            }

            if (typeof targetSync === 'string')
                targetSync = { name: targetSync }

            let entity = this.entities[targetSync.name]

            let find = entity.model.find(newFind)

            if (select)
                find = find.select(select)

            return await find.exec()
        }
    }

    syncronized (entityName, field, source, target, nameSyncronized) {
        try {
            if (!target.syncronized)
                target.syncronized = {}

            if (nameSyncronized.match(/\./)) {
                let newNameSyncronized = nameSyncronized.split('.')[0]

                if (!target.syncronized[newNameSyncronized])
                    target.syncronized[newNameSyncronized] = { attrs: [], descriptors: [] }

                nameSyncronized = nameSyncronized.split('.').slice(1).join('.')

                this.syncronized(entityName, field, source, target.syncronized[newNameSyncronized], nameSyncronized)
            } else {
                if (!target.syncronized[nameSyncronized])
                    target.syncronized[nameSyncronized] = { attrs: [], descriptors: [] }

                target.syncronized[nameSyncronized].attrs.push(field)

                if (typeof source.sync[field] === 'object')
                    target.syncronized[nameSyncronized].descriptors.push({ ...source.sync[field], field })
                else
                    target.syncronized[nameSyncronized].descriptors.push({ name: entityName, field })
            }
        } catch (err) {
            throw internalError(err)
        }
    }

    sync (source, nameSyncronized) {
        try {
            for (let field in source.sync) {
                let entityName = source.sync[field]

                if (typeof entityName === 'object')
                    entityName = entityName.name

                let subEntity = this.entities[entityName]

                this.syncronized(entityName, field, source, subEntity, nameSyncronized)

                if (source.sync.sync)
                    this.sync(source.sync, `${nameSyncronized}.${field}`)
            }
        } catch (err) {
            throw internalError(err)
        }
    }

    async fill (data, sync, rec=true) {
        try {
            if (!rec || !data || !sync) return data
            if (typeof rec === 'number' && rec > 0) rec--

            for (let attr in sync) {
                let options = sync[attr]

                if (typeof options === 'string')
                    options = { name: options }

                if (!data[attr])
                    continue
                
                let value = data[attr]

                if (value instanceof Array && value.length === 0)
                    continue
                if (!(value instanceof Array) && !value.id)
                    continue

                let originalIsArray = true

                if (!(value instanceof Array)) {
                    originalIsArray = false
                    value = [value]
                }

                let ids = value.map(v => v.id)

                options.rec = options.rec || 0

                if (options.rec > 0 && rec === true || rec > 0 || rec < 0) {

                    let subEntities = []

                    if (options.name) {
                        let subEntity = this.entities[options.name]
                        subEntities = await subEntity.findByIds(ids)
                    }

                    let recursive = rec
                    
                    if (rec === true)
                        recursive = options.rec-1
                    
                    for (let [se, index] of enumerate(subEntities))
                        subEntities[index] = await this.fill(se, subEntity.sync, recursive)

                    recursive = rec

                    if (rec === true)
                        recursive = options.rec

                    for (let [v, index] of enumerate(value))
                        if (options.sync)
                            value[index] = await this.fill(v, options.sync, recursive)

                    for (let [v, index] of enumerate(value))
                        value[index] = {
                            ...(subEntities && subEntities[index] || {}),
                            ...v,
                            $init: undefined
                        }
                }

                if (!originalIsArray)
                    value = value[0]
                
                data[attr] = value
            }

            return data
        } catch (err) {
            throw internalError(err)
        }
    }

    getConditionsBySubEntity (id, options, cmp=()=>true, path='') {
        try {
            let conditions = []
            
            if (cmp(options, id, path)) {
                conditions = options.descriptors.reduce((rt, descriptor) => {
                    let condition = {}
                    if (path)
                        condition[`${path}${descriptor.field}.id`] = id
                    else
                        condition[`${descriptor.field}.id`] = id
                    return [...rt, condition]
                }, [])
            }

            if (options.syncronized) {
                for (let subAttr in options.syncronized) {
                    conditions.push(
                        ...this.getConditionsBySubEntity(
                            id, options.syncronized[subAttr], cmp, `${subAttr}.`
                        )
                    )
                }
            }

            return conditions
        } catch (err) {
            throw internalError(err)
        }
    }

    async deleteSync (id, name, syncronized) {
        try {
            if (!id || !syncronized) return

            for (let entityName in syncronized) {
                let options = syncronized[entityName]
                let subEntity = this.entities[entityName]

                let count = 0

                let conditions = this.getConditionsBySubEntity(id, options, options=>options.required)

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

                conditions = this.getConditionsBySubEntity(id, options, options=>options.deleteCascade)

                if (conditions.length) {
                    entities = await subEntity.model.find({
                        $or: conditions
                    }).exec()
                }

                for (let entity of entities)
                    await subEntity.findByIdAndRemove(`${entity.id}`).exec()
            }

            for (let entityName in syncronized) {
                let options = syncronized[entityName]
                let subEntity = this.entities[entityName]
                
                let conditions = this.getConditionsBySubEntity(id, options)
                
                if (conditions.length) {
                    let entities = await subEntity.model.find({
                        $or: conditions
                    }).exec()

                    for (let entity of entities) {
                        entity = await subEntity.deleteCascadeAttrs(id, options, entity)
                        await subEntity.model.findByIdAndUpdate(entity._id, entity, { new: true }).exec()
                    }
                }
            }
        } catch (err) {
            throw internalError(err)
        }
    }

    add (entity) {
        try {
            this.entities[entity.name] = entity
            this.sync(entity, entity.name)
        } catch (err) {
            throw internalError(err)
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
            throw internalError(err)
        }
    }

    applyRouters (app) {
        for (let entityName in this.entities) {
            let entity = this.entities[entityName]
            entity.applyRouters(app)
        }
    }
}
