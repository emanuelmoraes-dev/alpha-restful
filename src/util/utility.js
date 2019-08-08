/**
 * Utilities for handling arrays and objects
 * @module alpha-restful/util/utility
 */
module.exports = exports = {
	/**
	 * Generator function that goes through 'enumeration', returning in each 
	 * iteration an array containing, respectively, its value and its position. 
	 * The value can also be obtained by accessing the 'value' attribute. The 
	 * position can also be obtained by accessing the 'index' attribute.
	 * @param {iterator} enumeration - Iterator to be iterated
	 * @returns {array} Each iterator value with its respective position
	 * @memberof module:alpha-restful/util/utility
	 * 
	 * @example
	 * for (let [value, index] of enumerate(['a', 'b', 7]))
	 *     console.log(`Value ${value} at position ${index}`)
	 * 
	 * // or
	 * 
	 * for (let {value, index} of enumerate(['a', 'b', 7]))
	 *     console.log(`Value ${value} at position ${index}`)
	 */
	enumerate: function* (enumeration) {
		let index = 0
		for (let value of enumeration) {
			yield Object.assign([ value, index ], { value, index })
			index++
		}
	},

	/**
	 * Returns string with special regular expression characters with escape
	 * @param {string} str - string to have its special RegExp characters with escape
	 * @returns {string} string with special regular expression characters with escape
	 * 
	 * @example
	 * scape('ab.*+?^${c}()|d[]\\ef') // ab\.\*\+\?\^\$\{c\}\(\)\|d\[\]\\ef
	 */
	scape (str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	},

	/**
	 * Gets the value of an object through its path
	 * @param {string} pathAttr - Attribute path containing desired value
	 * @param {Object} obj - Object containing desired attribute
	 * @param {boolean} [searchArray] - If true, the attributes that are array will recursively call this function at each value present in the array and throw the result of each position into another array that will be returned. If false, arrays are considered objects and their positions are considered attributes. Default value: false
	 * @returns {any} Value of an object through its path
	 * 
	 * @example
	 * let obj = {
	 *     a: {
	 *         b: 1,
	 *         c: 2
	 *     },
	 * 
	 *     b: [
	 *         { d: 3, e: 4 },
	 *         { d: 5, e: 6 },
	 *         { f: 7, g: 8, z: [{ info: '123' }] }
	 *     ]
	 * }
	 * 
	 * getAttr('a.b', obj) // 1
	 * getAttr('a.c', obj) // 2
	 * getAttr('b.2.f', obj) // 7
	 * getAttr('b.2.g', obj) // 8
	 * 
	 * getAttr('b.d', obj, true) // [3,5,undefined]
	 * getAttr('b.e', obj, true) // [4,6,undefined]
	 * getAttr('b.z.info', obj, true) // [undefined, undefined, ['123']]
	 */
	getAttr(pathAttr, obj, searchArray=false) {
		if (!obj)
			return obj

		if (searchArray && obj instanceof Array) {
			let rt = []

			for (let v of obj) {
				rt.push(exports.getAttr(pathAttr, v, searchArray))
			}

			return rt
		}

		if (pathAttr.match(/\./)) {
			let pathAttrArray = pathAttr.split('.')
			let pathRemaning = pathAttrArray.slice(1).join('.')
			let attr = pathAttrArray[0]
			let value = obj[attr]

			if (searchArray && value instanceof Array) {
				let rt = []
				for (let v of value) {
					rt.push(exports.getAttr(pathRemaning, v, searchArray))
				}
				return rt
			} else {
				return exports.getAttr(pathRemaning, value, searchArray)
			}
		} else {
			let value = obj[pathAttr]

			if (searchArray && value instanceof Array) {
				let rt = []
				for (let v of value) {
					rt.push(v)
				}
				return rt
			} else {
				return value
			}
		}
	},

	/**
	 * Allows you to easily concatenate all subarray elements of an array
	 * @param {array} array - Array that will have all of its subarray concatenated with itself
	 * @param {boolean} [ignoreNull] - If true, Ignore all null and undefined values. Default value: false
	 * @returns {array} Result of concatenation matrix of all subarrays
	 * 
	 * @example
	 * let a = [null, 1, 2, [3, undefined, 4, [5, 6], 7], 8, [null]]
	 * 
	 * extractValuesByArray(a) // [null, 1, 2, 3, undefined, 4, 5, 6, 7, 8, null]
	 * extractValuesByArray(a, true) // [1, 2, 3, 4, 5, 6, 7, 8]
	 */
	extractValuesByArray (array, ignoreNull=false) {
		if (array instanceof Array) {
			return array.reduce((p, n, i) => {
				if (n instanceof Array)
					return [...p, ...exports.extractValuesByArray(n)]
				else if (!ignoreNull || n !== null && n !== undefined)
					return [...p, n]
				else
					return p
			}, [])
		} else {
			return [array]
		}
	},

	/**
	 * Gets the value of each attribute and subatribute (attribute present in 
	 * an object that is the value of some attribute) present in "source" and 
	 * assigns it in "target". Attributes present in "target" but not present 
	 * in "source" are not replaced. This operation is similar to the REST 
	 * "patch" operation, except that the REST "path" operation assigns an 
	 * object value without parsing its subatributes. This method is used as 
	 * the REST "patch" method if the user provides the option 
	 * "patchRecursive = true".
	 * @param {Object} target - Object to have its attributes updated
	 * @param {Object} source - Object with updated values
	 * @returns {Object} target with updated values
	 * @memberof module:alpha-restful/util/utility
	 * 
	 * @example
	 * let old = {
	 *     v: 100,
	 *     p: 200,
	 *     a: {
	 *         b: 10,
	 *         c: 20
	 *     },
	 * 
	 *     b: {
	 *         d: {
	 *             w: 90,
	 *             y: 80,
	 *             z: [{ info: '321' }]
	 *         }
	 *     }
	 * }
	 * 
	 * let updated = {
	 *     p: 2,
	 *     a: {
	 *         b: 1
	 *     },
	 * 
	 *     b: {
	 *         d: {
	 *             w: 9,
	 *             z: [{ info2: '123' }],
	 *             newAttr: 'new'
	 *         }
	 *     }
	 * }
	 * 
	 * patchUpdate(old, updated)
	 * 
	 * console.log(old)
	 * // output:
	 * //
	 * // {
	 * //    v: 100,
	 * //    p: 2,
	 * //    a: {
	 * //        b: 1,
	 * //        c: 20
	 * //    },
	 * //
	 * //    b: {
	 * //        d: {
	 * //            w: 9,
	 * //            y: 80,
	 * //            z: [{ info2: '123' }],
	 * //            newAttr: 'new'
	 * //        }
	 * //    }
	 * // }
	 */
	patchUpdate (target, source) {
		if (!target) return source
		if (source instanceof Array) return source

		if (source && typeof source === 'object' && !(source instanceof Date)) {
			for (let key in source) {
				let value = source[key]
				target[key] = exports.patchUpdate(target[key], value)
			}
		} else {
			return source
		}

		return target
	}
}
