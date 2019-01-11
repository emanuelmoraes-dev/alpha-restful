Array.prototype.last = function () {
    return this[ this.length-1 ]
}

global.enumerate = function* (enumeration) {
    let index = 0
    for (let value of enumeration) {
        yield Object.assign([ value, index ], { value, index })
        index++
    }
}
