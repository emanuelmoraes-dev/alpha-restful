/**
 * All errors thrown by Alpha Restful will inherit this class.
 * @memberof module:alpha-restful/errors/generic-errors
 */
class AlphaRestfulError extends Error {
	/**
	 * Create an error thrown by Alpha Restful
	 * @param {string} message - Error message
	 */
	constructor(message) {
		super(message)
	}
}

/**
 * All errors thrown by Alpha Restful due to wrong values passed 
 * by the client through a route will inherit this class.
 * @memberof module:alpha-restful/errors/generic-errors
 */
class IllegalArgumentError extends AlphaRestfulError {
	/**
	 * Creates an error thrown by Alpha Restful due to wrong 
	 * values passed by the client in a route.
	 * @param {string} message - Error message
	 */
	constructor(message) {
		super(message)
	}
}

/**
 * Any errors thrown by Alpha Restful due to misuse of Alpha 
 * Restful will inherit this class.
 * @memberof module:alpha-restful/errors/generic-errors
 */
class InternalError extends AlphaRestfulError {
	/**
	 * Creates an error thrown by Alpha Restful due to 
	 * misuse of Alpha Restful
	 * @param {string} message - Error message
	 */
	constructor(message) {
		super(message)
	}
}

/**
 * Generic Errors
 * @module alpha-restful/errors/generic-errors
 */
module.exports = exports = {
	AlphaRestfulError,
	IllegalArgumentError,
	InternalError
}