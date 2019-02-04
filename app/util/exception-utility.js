module.exports = {
    internalError(err, restful) {
        if (!err.messageClient && (!err.status || err.status >= 500))
            return Object.assign(err, { status: err.status || 500, message: err.message, 
                messageClient: restful && restful.messageClientInternalError || 
                    'Erro Interno! Por Favor, Contatar seu Suporte!' })
        return err
    },

    IlegallArgumentError: class extends Error {
        constructor (messageClient, message, status=400) {
            super(message)
            if (!messageClient) messageClient = message
            this.messageClient = messageClient
            this.status = status
        }
    },

    RuntimeError: class extends Error {
        constructor (messageClient, message, status=500) {
            super(message)
            if (!messageClient) messageClient = message
            this.messageClient = messageClient
            this.status = status
        }
    }
}