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
		this.restful.debug('applying mongodb modeling ...')
		this.restful.structDb()
		this.restful.debug('modeling applied to mongodb')
		resolve()
		this.restful.debug('established connection with mongodb')
	}

	async connect () {
		this.restful.debug(`establishing connection to mongodb://${this.host}/${this.dbName} ...`)
		mongoose.connect(`mongodb://${this.host}/${this.dbName}`, { useNewUrlParser: true })
		return await (new this.restful.Promise((resolve, reject) => {
			db.on('error', this.onError.bind(this, reject))
			db.once('open', this.onOpen.bind(this, resolve))
		}))
	}
}
