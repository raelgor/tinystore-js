global.fetchBookByBnid = function (bnid) {

    var server = this;
    var GOT_EXTRA_INFO;
    var GOT_NORM_INFO;
    var promiseBuffer = [];

    log('fetchBookByBnid for ' + bnid + ' ...');

    return new Promise(function (res, rej) {

        if (isNaN(bnid)) {

            log('bnid is NaN. resolving...');
            return res({});

        }

        var cache = server.jadeCache["/item"].data;
        var db = server.db.collection('bnBooks');

        // Check if book is in cache
        if (bnid in cache) {

            // If someone else requested this book too
            // but its data is still being fetched, add
            // this request to the response buffer
            if(cache[bnid].isPromise){
                
                log('fetchBookByBnid ' + bnid + ' is promise. pushing resolve fn in buffer...');

                return cache[bnid].promiseBuffer.push(function () {

                    return res(cache[bnid]);

                });

            }

            log('fetchBookByBnid ' + bnid + ' found in cache. resolving...');

            // Let the cache know that this item
            // is wanted. The cache should update
            // mongodb with this information
            cache[bnid].requests++;

            return res(cache[bnid]);

        }

        log('fetchBookByBnid ' + bnid + ' not in cache. querying mongo...');

        // Create cache object in case we receive another
        // request during this search
        cache[bnid] = {

            isPromise: true,
            promiseBuffer: promiseBuffer

        }

        // Check if book is in mongo
        db.find({ bnid: bnid }).toArray(function (err, data) {

            // Cache and return
            if (!err && data[0]) {

                cache[bnid] = data[0];
                cache[bnid].requests = 1;

                log('fetchBookByBnid ' + bnid + ' found in mongo. caching and resolving...');

                // If the book was in mongo, renew
                // price but resolve response
                GOT_EXTRA_INFO = 1;
                GOT_NORM_INFO = 1;

                // If we never brought it or obsolete, fetch
                if (!data[0].marketPriceTS || (parseInt(new Date().getTime() - (data[0].marketPriceTS)) > 1000 * 60 * 60 * 24 * 7)) {

                    // Get extra info and update
                    getExtraInfo(data[0]).then(function (i) {
                        i && i.bnid && db.update({ bnid: i.bnid }, i);
                    });

                }

                return part(data[0]);

            }

            log('fetchBookByBnid ' + bnid + ' not found in mongo. calling scrapBookMeta...');

            // Check biblionet.gr
            scrapBookMeta(bnid).then(cb, cb);

            function cb(item) {

                GOT_NORM_INFO = 1;

                // If valid item scrapped, add
                // to cache and mongo
                if (item) {

                    log('fetchBookByBnid ' + bnid + ' scrapped. adding to mongo and cache and resolving...');

                    cache[bnid] = item;
                    cache[bnid].requests = 1;

                    db.insert(item);

                    // Get extra info and update
                    getExtraInfo(item).then(function (i) {

                        log('extra info fetched. updating mongo and resolving...');
                        i && i.bnid && db.update({ bnid: i.bnid }, i);

                        // Timed out
                        if (GOT_EXTRA_INFO) return;

                        GOT_EXTRA_INFO = 1;
                        part(i);

                    });

                } else {

                    log('fetchBookByBnid ' + bnid + ' scrapping failed. resolving...');

                }

                // GOT_EXTRA_INFO will be missing
                part(item);

            }

        });

        function part(item) {

            if (GOT_NORM_INFO && GOT_EXTRA_INFO) {

                // If other request came meanwhile, serve them too
                promiseBuffer.forEach(function (fn) { return fn(); });
                return res(item);

            }

            // Max wait for extra info: 3s after we would be ready
            if (GOT_NORM_INFO && !GOT_EXTRA_INFO) {

                log('waiting for extra info...');
                setTimeout(function () {

                    if (!GOT_EXTRA_INFO) {

                        log('extra info timeout. resolving...');
                        GOT_EXTRA_INFO = 1;
                        part(item);

                    }

                }, 0); // Set this if we want to wait for the price

            }

        }

    });

}