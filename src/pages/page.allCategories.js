module.exports = function (server) {

    fn.call(server);

}

function fn() {

    var server = this;
    var jadeCache = server.jadeCache;

    this.Router.get('/categories', function (req, res, next) {

        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

        var id = req.path.split('/')[2];
        var sres = {};
        var rel = [];

        res.send(jadeCache["/categories"].template({
            baseUrl: 'https://pazari-vivliou.gr/',
            udata: res._userData,
            csrf: zx.newSession.call(server.auth),
            alias: alias,
            price: price,
            head: {
                title: "Κατηγορίες - Παζάρι Βιβλίου",
                metaTitle: "Κατηγορίες - Παζάρι Βιβλίου",
                metaKeywords: "eshop shop bookstore online books Παζάρι Βιβλίου Το Online Βιβλιοπωλείο ebooks pazari vivliou παζάρι βιβλίου παζαρι βιβλιου βιβλιοπωλείο βιβλιοπωλειο",
                metaDescription: "Το μεγαλύτερο e-shop βιβλίων με τις καλύτερες τιμές!",
                metaOgImage: "https://pazari-vivliou.gr" + (sres.img ? sres.img : "/noimg.jpg"),
                metaOgSite_name: "Παζάρι Βιβλίου - Το Online Βιβλιοπωλείο",
                metaOgUrl: "https://pazari-vivliou.gr/item/" + sres.bnid + '/' + sres.alias,
                metaOgTitle: "Κατηγορίες - Παζάρι Βιβλίου",
                metaOgType: "website",
                metaOgLocale: "el_GR",
                metaOgDescription: "Το μεγαλύτερο e-shop βιβλίων με τις καλύτερες τιμές!"
            },
            suggested: jadeCache["/"].data.suggested,
            categories: jadeCache["/"].data.categories,
            menu: jadeCache["/"].data.menu
        }));

    });

}