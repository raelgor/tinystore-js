module.exports = function (server) {

    fn.call(server);

}

function fn() {

    var server = this;
    var jadeCache = server.jadeCache;

        this.Router.get('/wishlist', function (req, res, next) {

        var _userData = res._userData;
        var sres = [];

        var user = server.userCache.users[_userData.uuid] && server.userCache.users[_userData.uuid].obj;

        if (user && user.lists.wl) getBooksByBnids(Object.keys(user.lists.wl)).then(data => { for (var i in data) data[i] && data[i][1] && sres.push(data[i][1]); resolve(); });
        else resolve();

        function resolve() {
            
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

            res.send(jadeCache['/wishlist'].template({
                baseUrl: 'https://pazari-vivliou.gr/',
                udata: res._userData,
                csrf: zx.newSession.call(server.auth),
                alias: alias,
                price: price,
                head: {
                    title: "Checkout - Παζάρι Βιβλίου",
                    metaTitle: "Checkout - Παζάρι Βιβλίου",
                    metaKeywords: "eshop shop bookstore online books Παζάρι Βιβλίου Το Online Βιβλιοπωλείο ebooks pazari vivliou παζάρι βιβλίου παζαρι βιβλιου βιβλιοπωλείο βιβλιοπωλειο",
                    metaDescription: "Το μεγαλύτερο e-shop βιβλίων με τις καλύτερες τιμές!",
                    metaOgImage: "https://pazari-vivliou.gr/noimg.jpg",
                    metaOgSite_name: "Παζάρι Βιβλίου - Το Online Βιβλιοπωλείο",
                    metaOgUrl: "https://pazari-vivliou.gr/cart",
                    metaOgTitle: "Checkout - Παζάρι Βιβλίου",
                    metaOgType: "website",
                    metaOgLocale: "el_GR",
                    metaOgDescription: "Το μεγαλύτερο e-shop βιβλίων με τις καλύτερες τιμές!"
                },
                suggested: jadeCache["/"].data.suggested,
                categories: jadeCache["/"].data.categories,
                sres: sres,
                menu: jadeCache["/"].data.menu
            }));

        }

    });

}