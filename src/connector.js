const mongoose = require('mongoose')
const { InternalError } = require('./errors/generic_errors')
const db = mongoose.connection

/**
 * Responsible for encapsulating the Alpha Restful instance and 
 * providing methods for connecting Alpha Restful with MongoDB.
 * @memberof module:alpha-restful
 */
class Connector {
	/**
	 * Responsible for encapsulating the Alpha Restful instance and 
	 * providing methods for connecting Alpha Restful with MongoDB.
	 * @param {AlphaRestful} restful - Alpha Restful Instance
	 * @param {Object} app - Express JS instance. See on {@link http://expressjs.com}
	 * @param {Object} connInfo
	 * @param {boolean} [connInfo.useNewUrlParser] - Flag used for mongoose. See on {@link https://mongoosejs.com/docs/deprecations.html#the-usenewurlparser-option}
	 * @param {string} [connInfo.url] - String used to connect to MongoDB
	 * @param {string} [connInfo.host] - Database location. Example: 'localhost'
	 * @param {string} [connInfo.dbName] - Database Name
	 */
	constructor (restful, app, { useNewUrlParser=true, url=null, host=null, dbName=null }={}) {
		if (!url && (!host || !dbName)) 
			throw new InternalError("The 'url' parameter is required unless the 'host' and 'dbName' parameters are passed")

		if (!url) 
			url = `mongodb://${host}/${dbName}`

		this.url = url
		this.restful = restful
		this.app = app
		this.useNewUrlParser = useNewUrlParser
	}

	// Executed if an error occurs while connecting to MongoDB
	_onError(reject, err) {
		reject(err)
		console.error('connection error:', err)
	}

	// Executed if MongoDB connection succeeds
	_onOpen(resolve) {
		this.restful.debug('applying mongodb modeling ...')
		this.restful.structDb()
		this.restful.debug('modeling applied to mongodb')
		this.restful.db = mongoose.connection.db
		resolve()
		this.restful.debug('established connection with mongodb')
	}

	/**
	 * Connect Alpha Restful to MongoDB
	 * @returns resolve() or reject(error)
	 */
	async connect () {
		this.restful.debug(`establishing connection to ${this.url} ...`)
		mongoose.connect(this.url, { useNewUrlParser: this.useNewUrlParser })
		return await (new this.restful.Promise((resolve, reject) => {
			db.on('error', this._onError.bind(this, reject))
			db.once('open', this._onOpen.bind(this, resolve))
		}))
	}
}

module.exports = exports = Connector