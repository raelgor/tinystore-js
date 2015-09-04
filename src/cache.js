module.exports = function (server, jadeCache) {

    var oid = require('mongodb').ObjectID;

    // Cache interval
    server.cacheInterval = setInterval(updt(), 1000 * 60);
    
    // Caching fn
    function cacheItems(options) {
        
        var db = server.db;
        
        options.data = options.data || [];

        if (!options.data.length) return options.target[options.objKey] = [];

        // Cache suggested
        var contents = options.data.filter(function (e) {

            return e.namespace == options.namespace;

        })[0].contents;

        var _ids = [];
        var key;
        var type;

        contents.forEach(function (e) {
            
            key = e.uid;
            type = e.type;

            key == "_id" && (e.id = oid(e.id));

            _ids.push(e.id);

        });

        var query = {};
        
        query[key] = { $in: _ids }

        db.collection(type).aggregate([
            {
                $match: query
            }
        ]).sort({title:1}).toArray(function (err, data) {

            options.target[options.objKey] = data

        });

    }

    // Cache update
    function updt() {

        var ram = process.memoryUsage();

        zx.log('[' + parseInt(ram.heapUsed / 1000 / 1000) + '/' + parseInt(ram.heapTotal / 1000 / 1000) + ' rss:' + parseInt(ram.rss / 1000 / 1000) + ' MB] Updating cache...');

        // Load jade files
        jadeCache["/"].template = jadeCache["/"].template || jade.compileFile(__dirname + '/../layouts/index.jade', {});
        jadeCache["/search"].template = jadeCache["/search"].template || jade.compileFile(__dirname + '/../layouts/search.jade', {});
        jadeCache["/item"].template = jadeCache["/item"].template || jade.compileFile(__dirname + '/../layouts/item.jade', {});
        jadeCache["/list"].template = jadeCache["/list"].template || jade.compileFile(__dirname + '/../layouts/category.jade', {});

        // Only template in cache
        jadeCache["/categories"].template = jadeCache["/categories"].template || jade.compileFile(__dirname + '/../layouts/allcategories.jade', {});
        jadeCache["/terms-of-service"].template = jadeCache["/terms-of-service"].template || jade.compileFile(__dirname + '/../layouts/static.tos.jade', {});
        jadeCache["/privacy-policy"].template = jadeCache["/privacy-policy"].template || jade.compileFile(__dirname + '/../layouts/static.privacy.jade', {});
        jadeCache["/about"].template = jadeCache["/about"].template || jade.compileFile(__dirname + '/../layouts/static.about.jade', {});

        log("[/search]: " + Object.keys(jadeCache["/search"].data).length);
        log("[/item]: " + Object.keys(jadeCache["/item"].data).length);
        log("[/list]: " + Object.keys(jadeCache["/list"].data).length);

        // Data for / page
        server.db.collection('sitemap').find({

            namespace: {
                $in: [
                    "main-nav",
                    "paixnidia",
                    "categories",
                    "prosfores",
                    "books",
                    "proteinomena",
                    "carousel",
                    "nees-kuklofories-home"
                ]
            }

        }).toArray(function (err, data) {
            
            // Cache suggested
            cacheItems({
                
                target: jadeCache["/"].data,
                objKey: "suggested",
                data: data,
                namespace: "proteinomena",
                skip: null,
                limit: null
               
            });

            // Cache categories
            cacheItems({

                target: jadeCache["/"].data,
                objKey: "categories",
                data: data,
                namespace: "categories",
                skip: null,
                limit: null

            });

            // Cache main menu
            cacheItems({

                target: jadeCache["/"].data,
                objKey: "menu",
                data: data,
                namespace: "main-nav",
                skip: null,
                limit: null

            });

            // Cache carousel
            cacheItems({

                target: jadeCache["/"].data,
                objKey: "carousel",
                data: data,
                namespace: "carousel",
                skip: null,
                limit: null

            });

            // Cache nees-kuklofories-home
            cacheItems({

                target: jadeCache["/"].data,
                objKey: "nchome",
                data: data,
                namespace: "nees-kuklofories-home",
                skip: null,
                limit: null

            });
            
            // Cache offers books
            server.db.collection('bnSearchCache').find({

                term: "list::100000002::1"

            }).toArray(function (err, data) {
                
                var c = data[0].bnIDs;

                server.db.collection('bnBooks').find({
                    bnid: { $in: c }
                }).toArray(function (err, data) {

                    jadeCache["/"].data.otherbooks = data;

                });

            });

        });

        return updt;

    }

}