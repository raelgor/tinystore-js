module.exports = function (server) {

    fn.call(server);

}

function fn() {

    var server = this;
    var jadeCache = server.jadeCache;

    this.Router.get('/', function (req, res, next) {

        res.setHeader("Cache-Control", "no-cache, must-revalidate");

        res.send(jadeCache["/"].template({
            baseUrl: '/',
            udata: res._userData,
            csrf: zx.newSession.call(server.auth),
            cartText: "Το καλάθι σας είναι άδειο",
            loginText1: "Σύνδεση",
            loginText2: "Εγγραφή",
            alias: alias,
            price: price,
            head: {
                title: "Παζάρι Βιβλίου - Το Online Βιβλιοπωλείο",
                metaTitle: "Παζάρι Βιβλίου - Το Online Βιβλιοπωλείο",
                metaKeywords: "eshop shop bookstore online books Παζάρι Βιβλίου Το Online Βιβλιοπωλείο ebooks pazari vivliou παζάρι βιβλίου παζαρι βιβλιου βιβλιοπωλείο βιβλιοπωλειο",
                metaDescription: "Το μεγαλύτερο e-shop βιβλίων με τις καλύτερες τιμές!",
                metaOgImage: "https://" + config.domain + "/ogimg.jpg",
                metaOgSite_name: "Παζάρι Βιβλίου - Το Online Βιβλιοπωλείο",
                metaOgUrl: "https://" + config.domain,
                metaOgTitle: "Παζάρι Βιβλίου - Το Online Βιβλιοπωλείο",
                metaOgType: "website",
                metaOgLocale: "el_GR",
                metaOgDescription: "Το μεγαλύτερο e-shop βιβλίων με τις καλύτερες τιμές!"
            },
            suggested: jadeCache["/"].data.suggested,
            categories: jadeCache["/"].data.categories,
            menu: jadeCache["/"].data.menu,
            carousel: jadeCache["/"].data.carousel,
            nchome: jadeCache["/"].data.nchome,
            otherbooks: jadeCache["/"].data.otherbooks
        }));

        res.end();

    });

}