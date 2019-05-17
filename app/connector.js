const mongoose = require('mongoose')
const Restful = require('./restful')
const db = mongoose.connection

module.exports = class Connector {
	constructor (dbName, host, restful, app, useNewUrlParser) {
		if (host instanceof Restful) {
			this.url = dbName
			this.useNewUrlParser = !!app
			this.app = restful
			this.restful = host
			this.host = null
			this.dbName = null
		} else {
			this.url = null
			this.dbName = dbName
			this.host = host
			this.restful = restful
			this.app = app
			this.useNewUrlParser = !!useNewUrlParser
		}
	}

	onError(reject, err) {
		reject(err)
		console.error('connection error:', err)
	}

	onOpen(resolve) {
		this.restful.debug('applying mongodb modeling ...')
		this.restful.structDb()
		this.restful.debug('modeling applied to mongodb')
		this.restful.db = mongoose.connection.db
		resolve()
		this.restful.debug('established connection with mongodb')
	}

	async connect () {
		this.restful.debug(`establishing connection to mongodb://${this.host}/${this.dbName} ...`)

		if (this.url)
			mongoose.connect(this.url, { useNewUrlParser: this.useNewUrlParser })
		else
			mongoose.connect(`mongodb://${this.host}/${this.dbName}`, { useNewUrlParser: this.useNewUrlParser })

		return await (new this.restful.Promise((resolve, reject) => {
			db.on('error', this.onError.bind(this, reject))
			db.once('open', this.onOpen.bind(this, resolve))
		}))
	}
}
