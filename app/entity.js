const { internalError, IlegallArgumentError, RuntimeError } = require('./util/exception-utility')
const { copyEntity, prepareEntity, patchUpdate } = require('./util/db-utility')

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
        requiredSync=true
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
            requiredSync
        })

        if (this.resource && this.resource[0] === '/')
            this.resource = this.resource.substring(1)

        this.syncronized = {}
        this.schema = null
        this.model = null
    }

    getRouteHandler(handlerName, parseEntity) {
        const that = this

        if (['beforeQuery', 'afterQuery', 'beforeCreate', 'afterCreate', 
        'beforeRemove', 'afterRemove', 'beforeEdit', 'afterEdit'].indexOf(handlerName) == -1)
            throw new Error(`Handler ${handlerName} Inválido!`)

        return async function (req, res, next) {

            let handler

            if (parseEntity)
                handler = that[handlerName].bind(that, res._content_)
            else
                handler = that[handlerName].bind(that)

            return await new Promise((resolve, reject) => {

                next = function () {
                    let arg = arguments[0]

                    if (arg)
                        reject(arg)
                    else
                        resolve()
                }

                let rt = handler(req, res, next)

                if (rt && typeof rt.then === 'function') {
                    rt.then(() => resolve()).catch(err => reject(err))
                }
            })
        }
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
            this.getRouteHandler('beforeQuery', false),
            async function (req, res, next) {
                res._content_ = await that.model.findOne({ _id: req.params.id }).exec()
                // res._content_ = copyEntity(res._content_)
            }, 
            this.afterGetFill(restful),
            this.afterGetProjections(restful),
            this.getRouteHandler('afterQuery', true),
            async function (req, res, next) {
                if (res._content_)
                    res.status(200).send(res._content_)
                else
                    throw new IlegallArgumentError(`Entidade com id ${req.params.id} inexistente!`)
            }
        )
    }

    getRouter (restful) {
        if (this.methods.indexOf('get') === -1)
            return

        return restful.execAsync(
            this.getRouteHandler('beforeQuery', false),
            this.getQuery(restful),
            this.afterGetFill(restful),
            this.afterGetProjections(restful),
            this.getRouteHandler('afterQuery', true),
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
            },
            this.getRouteHandler('beforeCreate', true),
            async function (req, res, next) {
                await res._content_.save()
            },
            this.getRouteHandler('afterCreate', true),
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
                return await new Promise((resolve, reject) => {
                    // req.body = prepareEntity(req.body, that.descriptor)
                    req.body._id = req.params.id
                    res._content_ = req.body
                    resolve()
                })
            },
            this.getRouteHandler('beforeEdit', true),
            this.beforeCreateAndEditVerifyIds(restful),
            async function (req, res, next) {
                return await new Promise((resolve, reject) => {
                    that.model.findByIdAndUpdate(
                        req.params.id,
                        res._content_,
                        {new: true},
                        (err, todo) => {
                            if (err) return reject(internalError(err, restful))
                            res._content_ = todo
                            resolve()
                        }
                    )
                })
            },
            this.getRouteHandler('afterEdit', true),
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
            },
            this.getRouteHandler('beforeRemove', true),
            this.beforeDeleteSync(restful),
            async function (req, res, next) {
                await res._content_.remove()
            },
            this.getRouteHandler('afterRemove', true),
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
            },
            this.getRouteHandler('beforeEdit', true),
            this.beforeCreateAndEditVerifyIds(restful),
            async function (req, res, next) {
                return await new Promise((resolve, reject) => {
                    that.model.findByIdAndUpdate(
                        req.params.id,
                        res._content_,
                        {new: true},
                        (err, todo) => {
                            if (err) return reject(internalError(err, restful))
                            res._content_ = todo
                            resolve()
                        }
                    )
                })
            },
            this.getRouteHandler('afterEdit', true),
            async function (req, res, next) {
                res.status(200).send(res._content_)
            }
        )
    }

    async query (find, restful) {
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
                restful.sortName
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
                    if (['$in', '$nin', '$gt', '$gte', '$lt', '$leq', '$eq'].indexOf(keyArray[1])+1) {

                        let condition = {}
                        condition[keyArray[0]] = {}
                        condition[keyArray[0]][keyArray[1]] = find[key]

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

        if (find[restful.selectCountName] == 'true') {
            return await restful.query(newFind, this, this.descriptor, { 
                limit, skip, selectCount: true, internalSearch: true
            })
        } else {
            return await restful.query(newFind, this, this.descriptor, {
                limit, skip, sort, select, internalSearch: true
            })
        }
    }

    getQuery (restful) {
        const that = this
        return async function (req, res, next) {
            res._content_ = await that.query(req.query, restful)
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

    async fill (content, restful) {
        try {
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
                content[index] = await restful.fill(value, this.sync, value._id)
                content[index] = restful.ignoreFields(value, this.sync, 
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
            if (that.fillSync)
                res._content_ = await that.fill(res._content_, restful)
        }
    }

    async parseFromProjection(projection, content) {
        if (typeof projection === 'function') {
            return await Promise.resolve(projection(content))
        } else if (projection instanceof Array) {
            for (let key of Object.keys(content)) {
                if (!(projection.indexOf(key) + 1))
                    delete content[key]
            }
            return content
        } else if (typeof projection === 'object') {
            let anterior = {}

            for (let key of Object.keys(projection)) {
                anterior[key] = await Promise.resolve(projection[key](content, content[key]))
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
                    content[i] = await this.parseFromProjection(projection, entity)
                }
            } else {
                content = copyEntity(content)
                content = await this.parseFromProjection(projection, content)
            }

            return content
        } catch (err) {
            throw internalError(err, restful)
        }
    }

    afterGetProjections(restful) {
        const that = this
        return async function (req, res, next) {
            res._content_ = await that.applyProjections(res._content_, req.query[restful.projectionName], restful)
        }
    }

    beforeDeleteSync (restful) {
        const that = this
        return async function (req, res, next) {
            if (that.removeSync)
                await restful.deleteSync(req.params.id, that.name, that.syncronized)
        }
    }

    deleteCascadeAttrs (subEntityId, options, target) {

        for (let descriptor of options.descriptors) {

            if (descriptor.ignoreVerifyRelationship)
                continue

            let field = descriptor.field
            let ignoreInvalidRelationships = descriptor.ignoreInvalidRelationships

            if (ignoreInvalidRelationships)
                continue

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
                await restful.verifyIds(value, this.sync)
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
        }
    }

    async beforeQuery (req, res, next){}
    async afterQuery (entity, req, res, next){}

    async beforeCreate (entity, req, res, next){}
    async afterCreate (entity, req, res, next){}

    async beforeRemove (entity, req, res, next){}
    async afterRemove (entity, req, res, next){}

    async beforeEdit (entity, req, res, next){}
    async afterEdit (entity, req, res, next){}
}
