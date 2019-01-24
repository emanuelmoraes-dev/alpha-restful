module.exports = exports = {
    copyEntity (data) {
        if (!data) return data
        if (data instanceof Array) {
            return data.map(e => exports.copyEntity(e))
        } else {
            if (data._doc)
                data = data._doc
            return {
                ...data
            }
        }
    },
    convertType(type, value) {

        if (value && value instanceof Array) {
            for (let [v, i] of value)
                value[i] = exports.convertType(type, v)
            return value
        } else if (value && typeof value === 'object') {
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
            else if (type === Date)
                return new Date(value)
            return value
        }
    }
}