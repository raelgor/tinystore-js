module.exports = function (server) {

    fn.call(server);

}

function fn() {

    var server = this;
    var jadeCache = server.jadeCache;

    this.Router.get([
        '/privacy-policy',
        '/terms-of-service',
        '/about'
    ], function (req, res, next) {

        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

        var id = req.path.split('/')[1];

        var data = {

            "privacy-policy": { title: "Προσωπικά δεδομένα" },
            "terms-of-service": { title: "Όροι χρήσης" },
            "about": { title: "Η εταιρία μας" }

        }

        res.send(jadeCache[req.path].template({
            baseUrl: 'https://pazari-vivliou.gr/',
            udata: res._userData,
            csrf: zx.newSession.call(server.auth),
            alias: alias,
            price: price,
            head: {
                title: data[id].title + " - Παζάρι Βιβλίου",
                metaTitle: data[id].title + " - Παζάρι Βιβλίου",
                metaKeywords: "eshop shop bookstore online books Παζάρι Βιβλίου Το Online Βιβλιοπωλείο ebooks pazari vivliou παζάρι βιβλίου παζαρι βιβλιου βιβλιοπωλείο βιβλιοπωλειο",
                metaDescription: "Το μεγαλύτερο e-shop βιβλίων με τις καλύτερες τιμές!",
                metaOgImage: "https://pazari-vivliou.gr/noimg.jpg",
                metaOgSite_name: "Παζάρι Βιβλίου - Το Online Βιβλιοπωλείο",
                metaOgUrl: "https://pazari-vivliou.gr/" + id,
                metaOgTitle: data[id].title + " - Παζάρι Βιβλίου",
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