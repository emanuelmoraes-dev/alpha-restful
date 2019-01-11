#!/usr/bin/env node

/**
 * Module dependencies.
 */

const debug = require('debug')('restful-developer:server')
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

function onListening(resolve, server) {
	var addr = server.address();
	var bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port
	debug('Listening on ' + bind)
	resolve()
}

module.exports = async function start(app, connector) {
	/**
	 * Get port from environment and store in Express.
	 */

	await connector.connect()

	const port = normalizePort(process.env.PORT || '3000')
	app.set('port', port)

	/**
	 * Create HTTP server.
	 */

	const server = http.createServer(app)

	return await (new Promise((resolve, reject) => {
		/**
		 * Listen on provided port, on all network interfaces.
		 */

		server.listen(port)
		server.on('error', onError.bind(null, reject, port))
		server.on('listening', onListening.bind(null, resolve, server))
	}))
}