const createError = require('http-errors')

/**
 * Module dependencies.
 */

const http = require('http')

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
	var port = parseInt(val, 10)

	if (isNaN(port)) {
		// named pipe
		return val
	}

	if (port >= 0) {
		// port number
		return port
	}

	return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(reject, port, error) {
	reject(error)

	if (error.syscall !== 'listen') {
		throw error
	}

	var bind = typeof port === 'string'
		? 'Pipe ' + port
		: 'Port ' + port

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges')
			process.exit(1)
			break
		case 'EADDRINUSE':
			console.error(bind + ' is already in use')
			process.exit(1)
			break
		default:
			throw error
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(resolve, server, debug) {
	var addr = server.address();
	var bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port
	debug('Listening on ' + bind)
	resolve()
}

module.exports = async function start(connector, applicationName, createErrorHandler=false) {

	const app = connector.app

	if (createErrorHandler) {
		// catch 404 and forward to error handler
		app.use(function (req, res, next) {
			next(createError(404))
		})

		// error handler
		app.use(function(err, req, res, next) {
			err.status = err.status || 500
			err.messageClient = err.messageClient || err.message
			console.error(err)
			res.status(err.status).send({ message: err.message, messageClient: err.messageClient })
		})
	}

	const debug = require('debug')(applicationName + ':server')

	await connector.connect()

	/**
	 * Get port from environment and store in Express.
	 */

	const port = normalizePort(process.env.PORT || '3000')
	app.set('port', port)

	/**
	 * Create HTTP server.
	 */

	const server = http.createServer(app)

	return await (new connector.restful.Promise((resolve, reject) => {
		/**
		 * Listen on provided port, on all network interfaces.
		 */

		server.listen(port)
		server.on('error', onError.bind(null, reject, port))
		server.on('listening', onListening.bind(null, resolve, server, debug))
	}))
}
