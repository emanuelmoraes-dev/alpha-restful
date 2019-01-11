module.exports = {
    internalError(err) {
        if (!err.messageDev && (!err.status || err.status >= 500))
            return Object.assign(err, { status: 500, messageDev: err.message, 
                message: 'Erro Interno! Por Favor, Contatar seu Suporte!' })
        return err
    },

    IlegallArgumentError: class extends Error {
        constructor (message, messageDev, status=400) {
            super(message)
            if (!messageDev) messageDev = message
            this.messageDev = messageDev
            this.status = status
        }
    },

    RuntimeError: class extends Error {
        constructor (message, messageDev, status=500) {
            super(message)
            this.messageDev = messageDev
            this.status = status
        }
    }
}