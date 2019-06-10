module.exports = exports = {
	enumerate: function* (enumeration) {
		let index = 0
		for (let value of enumeration) {
			yield Object.assign([ value, index ], { value, index })
			index++
		}
	},

	scape (str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	},

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
	}
}
