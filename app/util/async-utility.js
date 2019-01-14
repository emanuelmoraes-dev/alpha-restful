const { internalError } = require('./exception-utility')

exports.execAsync = function () {
    try {
        let fsAsync, autoNext

        fsAsync = Array.prototype.slice.call(arguments)

        if (typeof fsAsync[0] === 'boolean') {
            fsAsync = fsAsync.slice(1)
            autoNext = fsAsync[0]
        } else if (typeof fsAsync.last() === 'boolean') {
            fsAsync = fsAsync.slice(0, fsAsync.length - 1)
            autoNext = fsAsync.last()
        } else {
            autoNext = false
        }

        return fsAsync.map((fAsync, index) => function (req, res, next) {
            Promise.resolve(fAsync(req, res, next))
                .then(() => {
                    if (index == fsAsync.length - 1) {
                        if (autoNext)
                            next()
                    }
                    else {
                        next()
                    }
                })
                .catch(err => { 
                    next(internalError(err))
                })
        })
    } catch (err) {
        throw internalError(err)
    }
}