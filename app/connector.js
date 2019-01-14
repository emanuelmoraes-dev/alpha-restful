const mongoose = require('mongoose')
const db = mongoose.connection

module.exports = class Connector {
    constructor (dbName, host, restful, app) {
        this.dbName = dbName
        this.host = host
        this.restful = restful
        this.app = app
    }

    onError(reject, err) {
        reject(err)
        console.error('connection error:', err)
    }

    onOpen(resolve) {
        this.restful.structDb()
        resolve()
    }

    async connect () {
        mongoose.connect(`mongodb://${this.host}/${this.dbName}`, { useNewUrlParser: true })
        return await (new Promise((resolve, reject) => {
            db.on('error', this.onError.bind(this, reject))
            db.once('open', this.onOpen.bind(this, resolve))
        }))
    }
}