const { internalError, IlegallArgumentError, RuntimeError } = require('./util/exception-utility')
const { execAsync } = require('./util/async-utility')

module.exports = class Entity {
    constructor ({
        name,
        resource,
        descriptor,
        sync={},
        projections={},
        projectionDefault=null,
        methods=['get', 'post', 'put', 'delete', 'patch']
    }={}) {
        Object.assign(this, {
            name,
            resource,
            descriptor,
            sync,
            projections,
            projectionDefault,
            methods
        })

        this.syncronized = {}
        this.schema = null
        this.model = null
    }

    applyRouters (app, restful) {
        if (this.methods.indexOf('get')+1) {
            app.get(`/${resource}/:id`, this.findOneRouter())
            app.get(`/${resource}`, this.getRouter(restful))
        }

        if (this.methods.indexOf('post')+1)
            app.post(`/${resource}`, this.postRouter(restful))

        if (this.methods.indexOf('put')+1)
            app.post(`/${resource}/:id`, this.putRouter(restful))
        
        if (this.methods.indexOf('delete')+1)
            app.post(`/${resource}/:id`, this.deleteRouter(restful))

        if (this.methods.indexOf('patch')+1)
            app.post(`/${resource}/:id`, this.patchRouter(restful))
    }

    findOneRouter () {
        let that = this
        return execAsync(true,
            this.beforeGet.bind(this),
            async function (req, res, next) {
                res._content_ = await that.model.findOne({ _id: req.params.id }).exec()
            }, 
            this.afterGetFill(restful),
            this.afterGetProjections(),
            this.afterGet.bind(this),
            async function (req, res, next) {
                res.status(200).send(req._content_)
            }
        )
    }

    getRouter (restful) {
        if (this.methods.indexOf('get') === -1)
            return

        return execAsync(true,
            this.beforeGet.bind(this),
            this.query(restful),
            this.afterGetFill(restful),
            this.afterGetProjections(),
            this.afterGet.bind(this),
            async function (req, res, next) {
                res.status(200).send(req._content_)
            }
        )
    }

    postRouter (restful) {
        if (this.methods.indexOf('post') === -1)
            return

        const that = this
        return execAsync(true,
            this.beforePost.bind(this),
            async function (req, res, next) {
                const entity = new that.model(req.body)
                await entity.save()
                res._content_ = entity
            },
            this.beforePost.bind(this),
            async function (req, res, next) {
                res.status(201).send(req._content_)
            }
        )
    }

    putRouter (restful) {
        if (this.methods.indexOf('put') === -1)
            return

        const that = this
        return execAsync(true,
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
                res.status(200).send(req._content_)
            }
        )
    }

    deleteRouter (restful) {
        if (this.methods.indexOf('delete') === -1)
            return

        const that = this
        return execAsync(true,
            this.beforeDeleteSync(restful),
            this.beforeDelete.bind(this),
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
        return execAsync(true,
            this.beforePut.bind(this),
            async function (req, res, next) {
                const id = req.bpdy._id
                
                let content = await that.model.findOne({ _id: id }).exec()
                
                if (content._doc)
                    content = content._doc
                
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
                res.status(200).send(req._content_)
            }
        )
    }

    query(restful) {
        const that = this
        return async function (req, res, next) {
            let select = null

            if (req.query.select) {
                select = req.query.__select
                delete req.query.select
            }

            let newFind = {}
            for (let key in req.query) {
                if (key.match(/__/)) {
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

                if (d._doc)
                    d = { ...d._doc }

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

                for (let { value, index } of enumerate(content))
                    content[index] = await restful.fill(value, that.sync)

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
                    if (entity._doc)
                        entity = entity._doc
                    entity = { ...entity }
                    content[i] = await this.parseFromProjection(projection, entity)
                }
            } else {
                if (content._doc)
                    content = content._doc
                content = { ...content }
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

    async deleteCascadeAttrs (id, options, entity) {
        if (entity._doc)
            entity = entity._doc

        entity = { ...entity }

        for (let descriptor of options.descriptors) {
            let field = descriptor.field

            if (entity[field] === undefined || entity[field] === null)
                continue
            if (entity[field] instanceof Array && entity[field].length) {
                entity[field] = entity[field].filter(it => it.id != id)
            } else {
                entity[field] = entity[field].id == id ? null : entity[field]
            }
        }

        return entity
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
