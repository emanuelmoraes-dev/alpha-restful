const { internalError } = require('./exception-utility')

exports.execAsync = function () {
    try {
        let fsAsync, autoSendStatus

        fsAsync = Array.prototype.slice.call(arguments)

        if (typeof fsAsync[0] === 'boolean' || typeof fsAsync[0] === 'number') {
            fsAsync = fsAsync.slice(1)
            autoSendStatus = fsAsync[0]
        } else if (typeof fsAsync.last() === 'boolean' || typeof fsAsync.last() === 'number') {
            fsAsync = fsAsync.slice(0, fsAsync.length - 1)
            autoSendStatus = fsAsync.last()
        } else {
            autoSendStatus = false
        }

        return fsAsync.map((fAsync, index) => function (req, res, next) {
            Promise.resolve(fAsync(req, res, next))
                .then(() => {
                    if (index == fsAsync.length - 1) {
                        if (autoSendStatus && typeof autoSendStatus === 'number')
                            res.status(autoSendStatus).send(res._content_)
                        else if (autoSendStatus)
                            res.status(200).send(res._content_)
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