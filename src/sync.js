const errors = require('./errors/sync-errors')

/**
 * Get an object of type {@link Sync} and check if all its attributes are correct and return the validated object
 * 
 * @param {Object|string} syncObj - {@link Sync} object to validate
 * @param {string} [syncObj.name] - Entity name to sync with attribute
 * @param {string|array} [syncObj.syncronized] - Attribute name used in the related entity (entity whose name is present in the "name" attribute) to relate to the attribute entity being synchronized
 * @param {Object} [syncObj.sync] - Object whose key is the name of an subattribute and the value is of type Sync
 * @param {boolean} [syncObj.jsonIgnore] - If true, the attribute will not be included in JSON if it is passed to the "Entity.fill" function. Default value: false
 * @param {boolean} [syncObj.fill] - If true, the attribute will be populated by the attributes present in the related entity stored in another Mongoose Schema. If false, the attribute will not be filled. Also indicates to Alpha Restful that there may be sub-attributes that can be filled in (with the fill option equal to true)
 * @param {boolean} [syncObj.subFill] - If true, indicates to Alpha Restful that there may be sub-attributes that can be filled in (with the fill option equal to true)
 * @param {array|string} [syncObj.ignoreFillProperties] - Attribute names that will not be populated from the recursion to which this option was declared
 * @param {array|string} [syncObj.ignoreJsonProperties] - Attribute names that will not be included in JSON from the recursion to which this option was declared
 * @param {boolean} [syncObj.required] - If true, instances synchronized with this attribute cannot be removed while this relationship exists. Default value: false
 * @param {boolean} [syncObj.deleteCascade] - If true, when instances related to this attribute are removed, the instance of the entity that owns this attribute will be removed as well. Default value: false
 * @param {boolean} [syncObj.virtual] - If true, the relationship of this attribute is virtual. Synchronized instances will be defined using a search specification, ie search filters are defined and all search results will be virtual synchronized to this attribute. Default value: false
 * @param {Object} [syncObj.find] - If "virtual" equals true, "find" contains a search object used to virtually sync instances of other entities that will result from this search. If "ignoreSubAttr" equals true, "find" contains a search object used to include in JSON only related instances that are also included in this search. This search object follows the specifications of the [Mongoose search object]{@link https://mongoosejs.com/docs/queries.html}, except that it considers sub-attributes of other documents as if they were all within the same document, even though they are in separate documents. Its default value is an empty object
 * @param {boolean} [syncObj.selectCount] - Used in conjunction with the "find" option to tell if the result is just the number of instances instead of the instances themselves. Default value: false
 * @param {string|array} [syncObj.sort] - Used in conjunction with "find" option to sort search results
 * @param {string|array} [syncObj.select] - Used in conjunction with the "find" option to select the attributes to select in the searched instances
 * @param {number} [syncObj.skip] - Used in conjunction with the "find" option to skip a set amount of fetched elements. Default value: 0
 * @param {number} [syncObj.limit] - Used in conjunction with the "find" option to define a maximum number of elements to include in the search
 * @param {boolean} [syncObj.ignoreSubAttr] - If true, relationship attributes are not included and only related entity attributes are present. Default value: false
 * @param {boolean} [syncObj.dynamicData] - If true, Alpha Restful will ignore any attributes present in related entities in searches, considering only sub-attributes present within the attribute itself, without performing any searches in other documents. This option is useful for attributes that contain hard-to-map values ​​in entity modeling. Default value: false
 * @param {boolean} [syncObj.rootIdentifier] -  If true, the related entity identifier is the value of the synchronized attribute. Default value: false
 * @param {string} [syncObj.identifierName] - If set to a non-empty string and "rootIdentifier" is equal to false, the related entity identifier will be stored in the attribute whose name is equal to this string. If this option is not set, the default value of "Entity.identifierName" is used by default
 * @param {boolean} [syncObj.notFilterCrudHttpGet] - If true, this attribute cannot be used as a search filter on the default HTTP GET route. Default value: false
 * @param {boolean} [syncObj.notFillCrudHttpGet] - If true, this attribute cannot be populated in the default HTTP GET route. Default value: false
 * @param {boolean} [validateSyncRecursice] - If true, "sync" will be validated with all its attributes and sub-attributes. Default value: false
 * 
 * @returns {Sync} Sync object validated
 * 
 * @memberof module:alpha-restful
 */
function sync(syncObj, validateSyncRecursice=false) {
    let copy = {...syncObj}

    let {
        name,
        syncronized,
        sync,
        jsonIgnore,
        fill,
        subFill,
        ignoreFillProperties,
        ignoreJsonProperties,
        required,
        deleteCascade,
        virtual,
        find,
        selectCount,
        sort,
        select,
        skip,
        limit,
        ignoreSubAttr,
        dynamicData,
        rootIdentifier,
        identifierName,
        notFilterCrudHttpGet,
        notFillCrudHttpGet
    } = copy

    delete copy.name
    delete copy.syncronized
    delete copy.sync
    delete copy.jsonIgnore
    delete copy.fill
    delete copy.subFill
    delete copy.ignoreFillProperties
    delete copy.ignoreJsonProperties
    delete copy.required
    delete copy.deleteCascade
    delete copy.virtual
    delete copy.find
    delete copy.selectCount
    delete copy.sort
    delete copy.select
    delete copy.skip
    delete copy.limit
    delete copy.ignoreSubAttr
    delete copy.dynamicData
    delete copy.rootIdentifier
    delete copy.identifierName
    delete copy.notFilterCrudHttpGet
    delete copy.notFillCrudHttpGet    

    // invalid options

    if (Object.keys(copy).length)
        throw new errors.SyncInesistentOptionError(Object.keys(copy)[0])

    // name

    if (name !==  undefined && (typeof name !== 'string' || !name.trim()))
        throw new errors.SyncInvalidNameOptionError(name)

    // syncronized

    if (
        syncronized !== undefined && 
        typeof syncronized !== 'string' &&
        (!(syncronized instanceof Array) || !syncronized.length)
    )
        throw new errors.SyncInvalidSyncronizedOptionError(syncronized)

    // sync

    if (
        sync !== undefined && 
        (sync === null || typeof  sync !== 'object' || validateSyncRecursice && !exports(sync, true))
    )
        throw new errors.SyncInvalidSyncOptionError(sync)

    // jsonIgnore

    if (jsonIgnore !== undefined && typeof jsonIgnore !== 'boolean')
        throw new errors.SyncInvalidJsonIgnoreOptionError(jsonIgnore)

    // fill

    if (fill !== undefined && typeof fill !== 'boolean')
        throw new errors.SyncInvalidFillOptionError(fill)

    // subFill

    if (subFill !== undefined && typeof subFill !== 'boolean')
        throw new errors.SyncInvalidSubFillOptionError(subFill)

    // ignoreFillProperties

    if (
        ignoreFillProperties !== undefined && 
        typeof ignoreFillProperties !== 'string' &&
        (!(ignoreFillProperties instanceof Array) || !ignoreFillProperties.length)
    )
        throw new errors.SyncInvalidIgnoreFillPropertiesOptionError(ignoreFillProperties)

    // ignoreJsonProperties

    if (
        ignoreJsonProperties !== undefined && 
        typeof ignoreJsonProperties !== 'string' &&
        (!(ignoreJsonProperties instanceof Array) || !ignoreJsonProperties.length)
    )
        throw new errors.SyncInvalidIgnoreJsonPropertiesOptionError(ignoreJsonProperties)

    return Object.assign(Object.create(exports.prototype), {
        name,
        syncronized,
        sync,
        jsonIgnore,
        fill,
        subFill,
        ignoreFillProperties,
        ignoreJsonProperties,
        required,
        deleteCascade,
        virtual,
        find,
        selectCount,
        sort,
        select,
        skip,
        limit,
        ignoreSubAttr,
        dynamicData,
        rootIdentifier,
        identifierName,
        notFilterCrudHttpGet,
        notFillCrudHttpGet
    })
}

module.exports = exports = sync

/**
 * Used to synchronize an attribute of one entity with instances of 
 * another entity. This synchronization allows entities to be related 
 * through relationship attributes. This synchronization also allows 
 * Alpha Restful to perform useful searches, checks, and operations 
 * involving related entities. If it is a string, the string must be 
 * the name of some entity registered in the framework
 * 
 * @typedef {Object|string} Sync
 * @property {string} [name] - Entity name to sync with attribute
 * @property {string|array} [syncronized] - Attribute name used in the related entity (entity whose name is present in the "name" attribute) to relate to the attribute entity being synchronized
 * @property {Object} [sync] - Object whose key is the name of an subattribute and the value is of type Sync
 * @property {boolean} [jsonIgnore] - If true, the attribute will not be included in JSON if it is passed to the "Entity.fill" function. Default value: false
 * @property {boolean} [fill] - If true, the attribute will be populated by the attributes present in the related entity stored in another Mongoose Schema. If false, the attribute will not be filled. Also indicates to Alpha Restful that there may be sub-attributes that can be filled in (with the fill option equal to true)
 * @property {boolean} [subFill] - If true, indicates to Alpha Restful that there may be sub-attributes that can be filled in (with the fill option equal to true)
 * @property {array|string} [ignoreFillProperties] - Attribute names that will not be populated from the recursion to which this option was declared
 * @property {array|string} [ignoreJsonProperties] - Attribute names that will not be included in JSON from the recursion to which this option was declared
 * @property {boolean} [required] - If true, instances synchronized with this attribute cannot be removed while this relationship exists. Default value: false
 * @property {boolean} [deleteCascade] - If true, when instances related to this attribute are removed, the instance of the entity that owns this attribute will be removed as well. Default value: false
 * @property {boolean} [virtual] - If true, the relationship of this attribute is virtual. Synchronized instances will be defined using a search specification, ie search filters are defined and all search results will be virtual synchronized to this attribute. Default value: false
 * @property {Object} [find] - If "virtual" equals true, "find" contains a search object used to virtually sync instances of other entities that will result from this search. If "ignoreSubAttr" equals true, "find" contains a search object used to include in JSON only related instances that are also included in this search. This search object follows the specifications of the [Mongoose search object]{@link https://mongoosejs.com/docs/queries.html}, except that it considers sub-attributes of other documents as if they were all within the same document, even though they are in separate documents. Its default value is an empty object
 * @property {boolean} [selectCount] - Used in conjunction with the "find" option to tell if the result is just the number of instances instead of the instances themselves. Default value: false
 * @property {string|array} [sort] - Used in conjunction with "find" option to sort search results
 * @property {string|array} [select] - Used in conjunction with the "find" option to select the attributes to select in the searched instances
 * @property {number} [skip] - Used in conjunction with the "find" option to skip a set amount of fetched elements. Default value: 0
 * @property {number} [limit] - Used in conjunction with the "find" option to define a maximum number of elements to include in the search
 * @property {boolean} [ignoreSubAttr] - If true, relationship attributes are not included and only related entity attributes are present. Default value: false
 * @property {boolean} [dynamicData] - If true, Alpha Restful will ignore any attributes present in related entities in searches, considering only sub-attributes present within the attribute itself, without performing any searches in other documents. This option is useful for attributes that contain hard-to-map values ​​in entity modeling. Default value: false
 * @property {boolean} [syncObj.rootIdentifier] -  If true, the related entity identifier is the value of the synchronized attribute. Default value: false
 * @property {string} [syncObj.identifierName] - If set to a non-empty string and "rootIdentifier" is equal to false, the related entity identifier will be stored in the attribute whose name is equal to this string. If this option is not set, the default value of "Entity.identifierName" is used by default
 * @property {boolean} [notFilterCrudHttpGet] - If true, this attribute cannot be used as a search filter on the default HTTP GET route. Default value: false
 * @property {boolean} [notFillCrudHttpGet] - If true, this attribute cannot be populated in the default HTTP GET route. Default value: false
 */