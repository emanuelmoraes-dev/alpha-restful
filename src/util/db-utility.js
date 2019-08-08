const isISODate = require('is-iso-date')
const { enumerate } = require('./utility')

/**
 * Utilities for data manipulation before or after 
 * performing certain operations on MongoDB database
 * @module alpha-restful/util/db-utility
 */
module.exports = exports = {
	/**
	 * Creates a copy object that allows you to change the values present in the copy.
	 * @param {Object} data - Object to copy
	 * @returns {Object} - Copy of 'data' object
	 * @memberof module:alpha-restful/util/db-utility
	 */
	copyEntity (data) {
		if (!data) return data
		return JSON.parse(JSON.stringify(data))
	},

	/**
	 * Convert value to specified type
	 * @param {object|function} t - Is or has the function that represents the type to be converted
	 * @param {function} t.type - If 't' is an object 'type' is the function that represents the type to be converted.
	 * @param {string|number|date|object|array} value - Value to convert. If it is an array, returns an array with the converted values. If it is an object, an object is returned with each converted property (except the 'type' property). The conversion is recursive to an array or object.
	 * @param {boolean} booleanToNumber - If true, boolean values are converted to number (1 = true and 0 = false)
	 * @returns {string|number|date|object|array} Converted value
	 * @memberof module:alpha-restful/util/db-utility
	 */
	convertType (t, value, booleanToNumber=false) {
		if (value === null || value === undefined || !t) return value

		if (value && value instanceof Array) {
			for (let [v, i] of enumerate(value))
				value[i] = exports.convertType(t, v)
			return value
		} else if (value && typeof value === 'object' && !(value instanceof Date)) {
			for (let key in value)
				value[key] = exports.convertType(t, value[key])
			return value
		} else {
			let type = t
			if (type && typeof type === 'object')
				type = type.type

			if (type === Number)
				return parseFloat(value)
			else if (type === String)
				return `${value}`
			else if (type === Date && typeof value === 'string' && isISODate(value))
				return new Date(value)
			else if (type === Boolean && booleanToNumber)
				return value && 1 || 0
			else if (type === Boolean)
				return !!value
			return value
		}
	}
}
