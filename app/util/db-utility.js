const isISODate = require('is-iso-date')

module.exports = exports = {
	copyEntity (data) {
		if (!data) return data
		return JSON.parse(JSON.stringify(data))
	},
	convertType (type, value) {
		if (!value) return value

		if (value && value instanceof Array) {
			for (let [v, i] of enumerate(value))
				value[i] = exports.convertType(type, v)
			return value
		} else if (value && typeof value === 'object' && !(value instanceof Date)) {
			for (let key in value)
				value[key] = exports.convertType(type, value[key])
			return value
		} else {
			if (type && typeof type === 'object')
				type = type.type

			if (type === Number)
				return parseFloat(value)
			else if (type === String)
				return `${value}`
			else if (type === Date && typeof value === 'string' && isISODate(value))
				return new Date(value)
			return value
		}
	},
	prepareEntity (source, descriptor) {
		if (descriptor instanceof Array)
			descriptor = descriptor[0]

		if (descriptor.type && descriptor.type !== Object) {
			if (source instanceof Array)
				for (let [value, index] of enumerate(source))
					source[index] = exports.convertType(descriptor, value)
			else
				return exports.convertType(descriptor, source)
		} else if (source instanceof Array) {
			for (let [value, index] of enumerate(source))
				source[index] = exports.prepareEntity(value, descriptor)
		} else {
			for (let key in descriptor) {
				let options = descriptor[key]
				source[key] = exports.convertType(options, source[key])
			}
		}

		return source
	},
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
