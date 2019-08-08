/**
 * Used to synchronize an attribute of one entity with instances of 
 * another entity. This synchronization allows entities to be related 
 * through relationship attributes. This synchronization also allows 
 * Alpha Restful to perform useful searches, checks, and operations 
 * involving related entities. If it is a string, the string must be 
 * the name of some entity registered in the framework
 * 
 * @typedef {Object|string} Sync
 * @property {string} name - Entity name to sync with attribute
 * @property {string|array} syncronized - Attribute name used in the related entity (entity whose name is present in the "name" attribute) to relate to the attribute entity being synchronized
 * @property {Object} sync - Object whose key is the name of an attribute and the value is of type Sync
 * @property {boolean} jsonIgnore - If true, the attribute will not be included in JSON if it is passed to the Entity.fill function
 * @property {boolean} fill - If true, the attribute will be populated by the attributes present in the related entity stored in another Mongoose Schema. If false, the attribute will not be filled
 */

/**
 * @memberof module:alpha-restful
 */
function sync(syncObj) {

}

module.exports = exports = sync