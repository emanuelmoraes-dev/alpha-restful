const { IllegalArgumentError, InternalError } = require('./generic-errors')

class SyncIllegalArgumentError extends IllegalArgumentError {
    constructor(message) {
        super(message)
    }
}

class SyncInternalError extends InternalError {
    constructor(message) {
        super(message)
    }
}

class SyncInesistentOptionError extends SyncInternalError {
    constructor(option, message) {
        super(message || `"${Option}" option cannot be set to Sync`)
        this.option = option
    }
}

class SyncInvalidOptionError extends SyncInternalError {
    constructor(attrName, option, message) {
        super(message || `"${attrName}" option with value ${option} is invalid for Sync`)
        this.attrName = attrName
        this.option = option
    }
}

class SyncInvalidNameOptionError extends SyncInvalidOptionError {
    constructor(name, message) {
        super('name', name, message || `"name" ${name} must be a non-empty string`)
    }
}

class SyncInvalidSyncronizedOptionError extends SyncInvalidOptionError {
    constructor(syncronized, message) {
        super('syncronized', syncronized, message || `"syncronized" ${syncronized} must be a non-empty string or array`)
    }
}

class SyncInvalidSyncOptionError extends SyncInvalidOptionError {
    constructor(sync, message) {
        super('sync', sync, message || `"sync" ${sync} must be a Object`)
    }
}

class SyncInvalidJsonIgnoreOptionError extends SyncInvalidOptionError {
    constructor(jsonIgnore, message) {
        super('jsonIgnore', jsonIgnore, message || `"jsonIgnore" ${sync} must be a Boolean`)
    }
}

class SyncInvalidFillOptionError extends SyncInvalidOptionError {
    constructor(fill, message) {
        super('fill', fill, message || `"fill" ${fill} must be a Boolean`)
    }
}

class SyncInvalidSubFillOptionError extends SyncInvalidOptionError {
    constructor(subFill, message) {
        super('subFill', subFill, message || `"subFill" ${subFill} must be a Boolean`)
    }
}

class SyncInvalidIgnoreFillPropertiesOptionError extends SyncInvalidOptionError {
    constructor(ignoreFillProperties, message) {
        super('ignoreFillProperties', ignoreFillProperties, message || `"ignoreFillProperties" ${ignoreFillProperties} must be a non-empty string or array`)
    }
}

class SyncInvalidIgnoreJsonPropertiesOptionError extends SyncInvalidOptionError {
    constructor(ignoreJsonProperties, message) {
        super('ignoreJsonProperties', ignoreJsonProperties, message || `"ignoreJsonProperties" ${ignoreJsonProperties} must be a non-empty string or array`)
    }
}

module.exports = exports = {
    SyncIllegalArgumentError,
    SyncInternalError,
    SyncInesistentOptionError,
    SyncInvalidOptionError,
    SyncInvalidNameOptionError,
    SyncInvalidSyncronizedOptionError,
    SyncInvalidSyncOptionError,
    SyncInvalidJsonIgnoreOptionError,
    SyncInvalidFillOptionError,
    SyncInvalidSubFillOptionError,
    SyncInvalidIgnoreFillPropertiesOptionError,
    SyncInvalidIgnoreJsonPropertiesOptionError
}