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
        if (process.env.DEBUG)
          console.log('applying mongodb modeling...')
        this.restful.structDb()
        if (process.env.DEBUG)
          console.log('modeling applied to mongodb')
        resolve()
        if (process.env.DEBUG)
          console.log('established connection with mongodb')
    }

    async connect () {
        if (process.env.DEBUG)
          console.log(`establishing connection to mongodb using "${this.host}" and "${this.dbName}" database name...`)
        mongoose.connect(`mongodb://${this.host}/${this.dbName}`, { useNewUrlParser: true })
        return await (new Promise((resolve, reject) => {
            db.on('error', this.onError.bind(this, reject))
            db.once('open', this.onOpen.bind(this, resolve))
        }))
    }
}
