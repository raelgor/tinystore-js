/* global getBooksFromUrl */
var CACHE_SEARCH_TIME = 1000 * 60 * 60 * 12;
var PAGE_SIZE = 24;

var addToCache = function (key, pool, obj) {

    log('caching ' + key + ' ...');

    return pool[key] = obj;

}

global.searchCast = function (options) {
    
    var server = appServer; 
    
    log('search.cast ' + JSON.stringify(options) + ' ...');

    var jadeCache = server.jadeCache;
    var promiseBuffer = [];

    var RESOLVED;
    var RENEW;

    var ret = [];

    var pageRequested = options.page;
    var q = options.query;

    var reqID = q + "::" + pageRequested;

    ret.ts = process.hrtime();

    return new Promise(function (resolve, reject) {

        function done(response) {

            if(RESOLVED) return;
            log('search.cast ' + JSON.stringify(options) + ' done. resolving...');

            promiseBuffer.forEach(function (fn) { return fn(); });

            response.ts = process.hrtime(ret.ts);

            RESOLVED = 1;
            resolve(response);

        }

        if (reqID in jadeCache["/search"].data) {

            log('search.cast ' + JSON.stringify(options) + ' found in cache (reqID: ' + reqID + '). done...');

            if (jadeCache["/search"].data[reqID].isPromise) {

                log('search.cast ' + JSON.stringify(options) + ' is promise. pushing resolve fn in buffer...');

                return jadeCache["/search"].data[reqID].promiseBuffer.push(function () {

                    return done(jadeCache["/search"].data[reqID]);

                });

            }

            var bookIDs = jadeCache["/search"].data[reqID];

            bookIDs.renewed++;

            done(bookIDs);

        }
        else {

            log('search.cast ' + JSON.stringify(options) + ' not found in cache. querying mongo...');

            jadeCache["/search"].data[reqID] = {

                isPromise: true,
                promiseBuffer: promiseBuffer

            }

            server.db.collection('bnSearchCache').find({ term: reqID }).toArray(function (err, data) {

                if (!err && data[0]) {

                    log('search.cast ' + JSON.stringify(options) + ' found in mongo. caching...');

                    var bookIDs = data[0].bnIDs;

                    bookIDs.resNum = data[0].resNum;

                    // Add search in cache
                    addToCache(reqID, jadeCache["/search"].data, bookIDs);

                    global.sitemap.addSearch.call(server, data[0]);

                    bookIDs.renewed = 0;

                    // Renew data in the background
                    if (new Date().getTime() - data[0].lastTS > 1000 * 60 * 60 * 24 * 7) {

                        var bnid = data[0].term.split('::')[1] ? (parseInt(data[0].term.split('::')[1]) || 0) : 0;

                        // If not custom category
                        if (bnid < 100000000) {

                            log('search.cast ' + JSON.stringify(options) + ' data was obsolete, renewing...');

                            RENEW = 1;

                            setTimeout(getTS, 0);

                        }

                    }

                    return done(bookIDs);

                }

                function getTS(ts, cookies) {

                    var key = !options.inCategory && !options.isbn ? "key=" + encodeURIComponent(q) : "_=1";
                    var timestart = (ts ? "&timestart=" + encodeURIComponent(ts) : "");
                    var page = "&Pointer=" + (pageRequested ? (+pageRequested - 1) * PAGE_SIZE : 0);
                    var isbn = typeof options.isbn == "string" ? "&isbn=" + options.isbn.split(' ').join('').split(/(isbn[:]*)/).join('').split('-').join('') : "";
                    var vars = "&page=results&titlesKind=0*1&esc=1&sortorder=-1&Pagesize=" + PAGE_SIZE;
                    var category = (options.inCategory ? "&subject=aaa&subject_ID=" + options.inCategory : "");
                    var uri = "/main.asp?" + key + timestart + vars + category + isbn + page;

                    log('search.cast ' + JSON.stringify(options) + ' not found in mongo. querying biblionet with getTS(' + ts + ') && uri = ' + uri + '...');

                    // Fetch biblionet book ids using biblionet's search
                    getBooksFromUrl(uri, cookies).then(cb, cb);

                    function cb(bookIDs) {

                        log('search.cast cb ts: ' + ts);
                        if (!ts) return getTS(bookIDs.ts || 1, bookIDs.cookies);

                        var searchObj = {
                            term: reqID,
                            resNum: bookIDs.resNum,
                            bnIDs: bookIDs,
                            isCat: options.inCategory || undefined,
                            lastTS: new Date().getTime()
                        };

                        // Add search in cache
                        // @todo Update this so that false data will not falsely update cache
                        // addToCache(reqID, jadeCache["/search"].data, bookIDs);

                        log('search.cast cb insert...');
                        !RENEW && server.db.collection('bnSearchCache').insert(searchObj);

                        if (RENEW) {
                            
                            if(!searchObj.bnIDs.length)
                                server.db.collection('bnSearchCache').update({ term: reqID }, { $set: { lastTS: searchObj.lastTS } }, { upsert: 1 });
                            else                  
                                server.db.collection('bnSearchCache').update({ term: reqID }, { $set: searchObj }, { upsert: 1 });

                        }
                        
                        if(RENEW && !searchObj.bnIDs.length)
                            log('RENEW flag was up but no BNIDs received. aborting update...');

                        global.sitemap.addSearch.call(server, searchObj);

                        bookIDs.renewed = 0;

                        log('search.cast cb done...');
                        return done(bookIDs);

                    }

                };

                getTS();

            });

        }

    });

}