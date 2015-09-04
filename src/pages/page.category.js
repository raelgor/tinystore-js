var PAGE_SIZE = 24;

module.exports = function (server) {

    fn.call(server);

}

function fn() {

    var server = this;
    var jadeCache = server.jadeCache;

    this.Router.get('/list/**/*', function (req, res, next) {

        res.setHeader("Cache-Control", "no-cache, must-revalidate");

        var cache = jadeCache["/list"].data;
        var pageRequested = parseInt(String(req.query.p).split('.')[0]) || 1;
        var id = req.path.split('/')[2];
        var SUBCAT_DONE;
        var ITEMS_DONE;
        var resNum;
        var sres = [];
        var cat;

        log('page.category ' + id + ' ...');

        if (id in cache) {

            cat = cache[id];

            log('page.category ' + id + ' found in cache. done...');

            SUBCAT_DONE = 1;

            done();

        } else {

            log('page.category ' + id + ' not found in cache. querying mongo...');

            server.db.collection('bnCategories').find({ bnid: id }).toArray(function (err, data) {

                cat = cache[id] = (data && data[0]) || {};

                if (cat) {

                    log('page.category ' + id + ' found in mongo. getting subcats...');

                    server.db.collection('bnCategories').find({ bnid: { $in: cat.contents } }).sort({ title: 1 }).toArray(function (err, data) {

                        cat.contents = data || [];

                        log('page.category ' + id + ' subcats fetched. done...');

                        SUBCAT_DONE = 1;
                        done();

                    });

                } else {

                    log('page.category ' + id + ' not found in mongo. done...');

                    SUBCAT_DONE = 1;
                    done();

                }

            });

        }

        function resolveBookIDs(bookIDs) {

            // Count resolved promises
            var resolved = 0;

            resNum = bookIDs.resNum || bookIDs.length;

            if (!bookIDs.length) {
                ITEMS_DONE = 1;
                return done();
            }

            // Find book info in order: cache || mongoCache || biblionet
            bookIDs.forEach(function (bnid) {

                fetchBookByBnid.call(server, bnid).then(cb, cb);

            });

            function cb(bookInfo) {

                sres.push(bookInfo);

                if (++resolved == bookIDs.length) {
                    ITEMS_DONE = 1;
                    done();
                }

            }

        }

        searchCast.call(server, {

            query: "list::" + id ,
            inCategory: id,
            page: pageRequested

        }).then(function (data) {

            var bookIDs = data;
            resNum = bookIDs.resNum;

            resolveBookIDs(bookIDs);

        });

        function done() {

            if (SUBCAT_DONE && ITEMS_DONE) {

                log('page.category ' + id + ' done...');

                return respond();

            }

        };

        function respond() {

            try {
                res.send(jadeCache["/list"].template({
                    baseUrl: 'https://pazari-vivliou.gr/',
                    udata: res._userData,
                    csrf: zx.newSession.call(server.auth),
                    alias: alias,
                    price: price,
                    head: {
                        title: cat.title + " - Παζάρι Βιβλίου",
                        metaTitle: cat.title + " - Παζάρι Βιβλίου",
                        metaKeywords: "eshop shop bookstore online books Παζάρι Βιβλίου Το Online Βιβλιοπωλείο ebooks pazari vivliou παζάρι βιβλίου παζαρι βιβλιου βιβλιοπωλείο βιβλιοπωλειο",
                        metaDescription: cat.title && cat.title.split(/[<>]/).join(''),
                        metaOgImage: "https://pazari-vivliou.gr/ogimg.jpg",
                        metaOgSite_name: "Παζάρι Βιβλίου - Το Online Βιβλιοπωλείο",
                        metaOgUrl: "https://pazari-vivliou.gr/list/" + cat.bnid + '/' + alias(cat.title),
                        metaOgTitle: cat.title + " - Παζάρι Βιβλίου",
                        metaOgType: "website",
                        metaOgLocale: "el_GR",
                        metaOgDescription: cat.title && cat.title.split(/[<>]/).join('')
                    },
                    pageline: {
                        curPage: pageRequested,
                        action: "/list/" + cat.bnid + '/' + alias(cat.title),
                        searchstring: null,
                        totalPages: parseInt(resNum / PAGE_SIZE) + (resNum % PAGE_SIZE != 0 ? 1 : 0)
                    },
                    suggested: jadeCache["/"].data.suggested,
                    categories: jadeCache["/"].data.categories,
                    menu: jadeCache["/"].data.menu,
                    sres: sres,
                    cat: cat,
                    resNum: resNum
                }));
            } catch (err) { console.log(err.stack); }

            res.end();

        }
        
    });

}