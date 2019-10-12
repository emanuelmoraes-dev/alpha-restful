const { InternalError } = require('./generic-errors')

class ConnectorError extends InternalError {
    constructor(message) {
        super(message)
    }
}

class ConnectorNonexistentConnectionParametersError extends ConnectorError {
    constructor(message) {
        super(message || "The 'url' parameter in the Connector builder is required unless the 'host' and 'dbName' parameters are passed")
    }
}

module.exports = exports = {
    ConnectorError,
    ConnectorNonexistentConnectionParametersError
}