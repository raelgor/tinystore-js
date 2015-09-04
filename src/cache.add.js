var log = require('./debug.log.js');

module.exports = function (key, pool, obj) {

    var cacheObj = [];

    log('caching ' + key + ' ...');

    return pool[key] = obj;

}