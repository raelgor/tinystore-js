module.exports = function (server) {

    fn.call(server);

}

function fn() {

    var server = this;
    var jadeCache = server.jadeCache;

    this.Router.get('/item/*', function (req, res, next) {

        res.setHeader("Cache-Control", "no-cache, must-revalidate");

        var cache = jadeCache["/item"].data;
        var id = req.path.split('/')[2];
        var sres = {};
        var rel = [];

        fetchBookByBnid.call(server, id).then(cb, cb);

        function resolveBookIDs(bookIDs) {

            // Count resolved promises
            var resolved = 0;

            resNum = bookIDs.resNum || bookIDs.length;

            if (!bookIDs.length) return respond();

            // Find book info in order: cache || mongoCache || biblionet
            bookIDs.forEach(function (bnid) {

                fetchBookByBnid.call(server, bnid).then(cb, cb);

            });

            function cb(bookInfo) {

                rel.push(bookInfo);

                if (++resolved == bookIDs.length) respond();

            }

        }

        function cb(item) {

            sres = item;

            if (item.categories.length) {

                searchCast.call(server, {

                    query: "list::" + (typeof item.categories[0] == "string" ? item.categories[0] : item.categories[0].bnid),
                    inCategory: (typeof item.categories[0] == "string" ? item.categories[0] : item.categories[0].bnid),
                    page: 1

                }).then(function (data) {

                    var bookIDs = data;
                    resNum = bookIDs.resNum;

                    resolveBookIDs(bookIDs.slice(0,8));

                });

            }
            else return respond();

        };

        function respond() {

            sres.categories.length && server.db.collection('bnCategories').find({ bnid: { $in: sres.categories } }).toArray(function (err, data) {

                (data && data[0] && (sres.categories = data));

                s();

            });

            function s() {

                res.send(jadeCache["/item"].template({
                    baseUrl: 'https://pazari-vivliou.gr/',
                    udata: res._userData,
                    csrf: zx.newSession.call(server.auth),
                    alias: alias,
                    price: price,
                    head: {
                        title: sres.title + " - Παζάρι Βιβλίου",
                        metaTitle: sres.title + " - Παζάρι Βιβλίου",
                        metaKeywords: "eshop shop bookstore online books Παζάρι Βιβλίου Το Online Βιβλιοπωλείο ebooks pazari vivliou παζάρι βιβλίου παζαρι βιβλιου βιβλιοπωλείο βιβλιοπωλειο",
                        metaDescription: sres.desc && sres.desc.split(/[<>]/).join(''),
                        metaOgImage: "https://pazari-vivliou.gr" + (sres.img ? sres.img : "/noimg.jpg"),
                        metaOgSite_name: "Παζάρι Βιβλίου - Το Online Βιβλιοπωλείο",
                        metaOgUrl: "https://pazari-vivliou.gr/item/" + sres.bnid + '/' + sres.alias,
                        metaOgTitle: sres.title + " - Παζάρι Βιβλίου",
                        metaOgType: "website",
                        metaOgLocale: "el_GR",
                        metaOgDescription: sres.desc && sres.desc.split(/[<>]/).join('')
                    },
                    suggested: jadeCache["/"].data.suggested,
                    categories: jadeCache["/"].data.categories,
                    menu: jadeCache["/"].data.menu,
                    sres: sres,
                    nchome: rel
                }));

            }

        }
        
    });

}