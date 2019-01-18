module.exports = {
    copyEntity (data) {
        if (!data) return data
        if (data instanceof Array) {
            return data.map(e => copyEntity(e))
        } else {
            if (data._doc)
                data = data._doc
            return {
                ...data
            }
        }
    }
}