const { internalError, IlegallArgumentError, RuntimeError } = require('./util/exception-utility')
const { execAsync } = require('./util/async-utility')
const { copyEntity } = require('./util/db-utility')

module.exports = class Entity {
    constructor ({
        name,
        resource,
        descriptor,
        sync={},
        projections={},
        projectionDefault=null,
        methods=['get', 'post', 'put', 'delete', 'patch'],
        ignoreFieldsRecursiveSubEntity=false,
        ignoreFieldsRecursive=false
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
            ignoreFieldsRecursive
        })

        this.syncronized = {}
        this.schema = null
        this.model = null
    }

    applyRouters (app, restful) {
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
        return execAsync(
            this.beforeGet.bind(this),
            async function (req, res, next) {
                res._content_ = await that.model.findOne({ _id: req.params.id }).exec()
                res._content_ = copyEntity(res._content_)
            }, 
            this.afterGetFill(restful),
            this.afterGetProjections(),
            this.afterGet.bind(this),
            async function (req, res, next) {
                res.status(200).send(res._content_)
            }
        )
    }

    getRouter (restful) {
        if (this.methods.indexOf('get') === -1)
            return

        return execAsync(
            this.beforeGet.bind(this),
            this.query(restful),
            this.afterGetFill(restful),
            this.afterGetProjections(),
            this.afterGet.bind(this),
            async function (req, res, next) {
                res.status(200).send(res._content_)
            }
        )
    }

    postRouter (restful) {
        if (this.methods.indexOf('post') === -1)
            return

        const that = this
        return execAsync(
            this.beforePost.bind(this),
            async function (req, res, next) {
                const entity = new that.model(req.body)
                await entity.save()
                res._content_ = entity
            },
            this.beforePost.bind(this),
            async function (req, res, next) {
                res.status(201).send(res._content_)
            }
        )
    }

    putRouter (restful) {
        if (this.methods.indexOf('put') === -1)
            return

        const that = this
        return execAsync(
            this.beforePut.bind(this),
            async function (req, res, next) {
                return await new Promise((resolve, reject) => {
                    that.model.findByIdAndUpdate(
                        req.params.id,
                        req.body,
                        {new: true},
                        (err, todo) => {
                            if (err) return reject(internalError(err))
                            res._content_ = todo
                            resolve()
                        }
                    )
                })
            },
            this.afterPut.bind(this),
            async function (req, res, next) {
                res.status(200).send(res._content_)
            }
        )
    }

    deleteRouter (restful) {
        if (this.methods.indexOf('delete') === -1)
            return

        const that = this
        return execAsync(
            this.beforeDelete.bind(this),
            this.beforeDeleteSync(restful),
            async function (req, res, next) {
                return await new Promise((resolve, reject) => {
                    that.model.findByIdAndRemove(req.params.id, (err, todo) => {
                        if (err) return reject(internalError(err))
                        resolve()
                    })
                })
            },
            this.afterDelete.bind(this),
            async function (req, res, next) {
                res.status(204).end()
            }
        )
    }

    patchRouter (restful) {
        if (this.methods.indexOf('patch') === -1)
            return

        const that = this
        return execAsync(
            this.beforePut.bind(this),
            async function (req, res, next) {
                const id = req.params.id
                
                let content = await that.model.findOne({ _id: id }).exec()
                
                content = copyEntity(content)
                
                content = {
                    ...content,
                    ...req.body
                }

                return await new Promise((resolve, reject) => {
                    
                    that.model.findByIdAndUpdate(
                        id,
                        content,
                        {new: true},
                        (err, todo) => {
                            if (err) return reject(internalError(err))
                            res._content_ = todo
                            resolve()
                        }
                    )
                })
            },
            this.afterPut.bind(this),
            async function (req, res, next) {
                res.status(200).send(res._content_)
            }
        )
    }

    query (restful) {
        const that = this
        return async function (req, res, next) {
            let select = null

            if (req.query.select) {
                select = req.query.__select
                delete req.query.select
            }

            let newFind = {}
            for (let key in req.query) {
                if (key.endsWith('__regex')) {
                    let value = req.query[key]
                    key = key.split('__regex')[0]
                    let regexp = value.split('/')
                    regexp = new RegExp(regexp[1], regexp[2])
                    newFind[attr] = regexp
                } else if (key.match(/__/)) {
                    let keyArray = key.split(/__/g)
                    newFind[keyArray[0]] = {}
                    newFind[keyArray[0]][keyArray[1]] = req.query[key]
                } else {
                    newFind[key] = req.query[key]
                }
            }

            res._content_ = await restful.query(newFind, that, that.descriptor, select)
        }
    }

    async findByIds (ids) {
        try {
            let data = []
            for (let id of ids) {
                let d = await this.model.findOne({
                    _id: id
                }).exec()

                d = copyEntity(d)

                if (d) data.push(d)
            }
            return data
        } catch (err) {
            throw internalError(err)
        }
    }

    afterGetFill (restful) {
        const that = this
        return async function (req, res, next) {
            try {
                let content = res._content_
                let isOriginalArray = true

                if (!(content instanceof Array)) {
                    isOriginalArray = false
                    content = [content]
                }

                for (let { value, index } of enumerate(content)) {
                    content[index] = await restful.fill(value, that.sync)
                    content[index] = restful.ignoreFields(value, that.sync, 
                        that.ignoreFieldsRecursive, that.ignoreFieldsRecursiveSubEntity)
                }

                if (!isOriginalArray)
                    res._content_ = content[0]
                else
                    res._content_ = content
            } catch (err) {
                throw internalError(err)
            }
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

    afterGetProjections() {
        const that = this
        return async function (req, res, next) {
            let projectionName = req.query.projection

            if (!projectionName) {
                if (!that.projectionDefault) return
                projectionName = that.projectionDefault
            }
            
            let projection = that.projections[projectionName]

            if (!projection)
                throw new IlegallArgumentError(`Projeção ${projectionName} não encontrada`)
            
            let content = res._content_

            if (content instanceof Array) {
                for (let [entity, i] of enumerate(content)) {
                    entity = copyEntity(entity)
                    content[i] = await this.parseFromProjection(projection, entity)
                }
            } else {
                content = copyEntity(content)
                content = await this.parseFromProjection(projection, content)
            }

            res._content_ = content
        }
    }

    beforeDeleteSync (restful) {
        const that = this
        return async function (req, res, next) {
            await restful.deleteSync(req.params.id, that.name, that.syncronized)
        }
    }

    deleteCascadeAttrs (subEntityId, options, target) {

        for (let descriptor of options.descriptors) {
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

    async beforeGet (req, res, next){}
    async afterGet (req, res, next){}

    async beforePost (req, res, next){}
    async afterPost (req, res, next){}

    async beforePut (req, res, next){}
    async afterPut (req, res, next){}

    async beforeDelete (req, res, next){}
    async afterDelete (req, res, next){}

    async beforePatch (req, res, next){}
    async afterPatch (req, res, next){}
}
