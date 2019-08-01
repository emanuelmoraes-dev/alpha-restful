/**
 * All errors thrown by Alpha Restful will inherit this class.
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
 */
class InternalError extends AlphaRestfulError {
	constructor(message) {
		super(message)
	}
}

module.exports = {
	AlphaRestfulError,
	IllegalArgumentError,
	InternalError
}