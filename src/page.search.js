var PAGE_SIZE = 24;

module.exports = function (server) {

    fn.call(server);

}

function fn() {

    var getBooksFromUrl = require('./search.getBooksFromUrl.js');

    var server = this;
    var jadeCache = server.jadeCache;

    this.Router.get('/search', function (req, res, next) {

        res.setHeader("Cache-Control", "no-cache, must-revalidate");

        var q = String(req.query.q).split('-').join('').trim().substring(0, 50).trim();
        var pageRequested = parseInt(String(req.query.p).split('.')[0]) || 1;
        var hr = process.hrtime();
        var sres = [];
        var resNum = 0;
        var reqID = q + "::" + pageRequested;

        // Exit if invalid search
        if (q.length < 2) return respond();

        function respond() {

            hr = process.hrtime(hr);

            res.send(jadeCache["/search"].template({
                baseUrl: 'https://pazari-vivliou.gr/',
                udata: res._userData,
                csrf: zx.newSession.call(server.auth),
                alias: require('./alias.js'),
                price: price,
                head: {
                    title: "Αποτελέσματα αναζήτησης για '" + q + "' - Παζάρι Βιβλίου",
                    metaTitle: "Παζάρι Βιβλίου - Το Online Βιβλιοπωλείο",
                    metaKeywords: "eshop shop bookstore online books Παζάρι Βιβλίου Το Online Βιβλιοπωλείο ebooks pazari vivliou παζάρι βιβλίου παζαρι βιβλιου βιβλιοπωλείο βιβλιοπωλειο",
                    metaDescription: "Το μεγαλύτερο e-shop βιβλίων με τις καλύτερες τιμές!",
                    metaOgImage: "https://pazari-vivliou.gr/ogimg.jpg",
                    metaOgSite_name: "Παζάρι Βιβλίου - Το Online Βιβλιοπωλείο",
                    metaOgUrl: "https://pazari-vivliou.gr",
                    metaOgTitle: "Παζάρι Βιβλίου - Το Online Βιβλιοπωλείο",
                    metaOgType: "website",
                    metaOgLocale: "el_GR",
                    metaOgDescription: "Το μεγαλύτερο e-shop βιβλίων με τις καλύτερες τιμές!"
                },
                suggested: jadeCache["/"].data.suggested,
                categories: jadeCache["/"].data.categories,
                menu: jadeCache["/"].data.menu,
                sres: sres,
                pageline: {
                    curPage: pageRequested,
                    action: "/search",
                    searchstring: q,
                    totalPages: parseInt(resNum/PAGE_SIZE) + (resNum%PAGE_SIZE!=0?1:0)
                },
                resNum: resNum,
                searchTerms: q,
                stime: hr[0] + hr[1] / 1000000000
            }));

            res.end();

        }

        function resolveBookIDs(bookIDs) {

            // Count resolved promises
            var resolved = 0;

            resNum = bookIDs.resNum || bookIDs.length;

            if (!bookIDs.length) return respond();

            // Find book info in order: cache || mongoCache || biblionet
            bookIDs.forEach(function (bnid) {

                require('./search.fetchBookByBnid.js').call(server, bnid).then(cb, cb);

            });

            function cb(bookInfo) {

                sres.push(bookInfo);

                if (++resolved == bookIDs.length) respond();

            }

        }

        require('./search.cast.js').call(server, {

            query: q,
            inCategory: null,
            page: pageRequested,
            isbn: /^(isbn[: ]*)*[0-9\-xχ]{10,17}$/i.test(q) && q

        }).then(function (data) {

            var bookIDs = data;
            resNum = bookIDs.resNum;

            resolveBookIDs(bookIDs);

        });

    });

}
