var path = require('path');
var force = require('express-force-domain');
var express = require('express');

global.appServer = new zx.Server({
    "db_type": "mongodb",
    "db_host": "mongodb://" + global.nw + ":27017/_eshop_bookstore",
    "db_user": "",
    "db_pass": "",
    "bind": global.nw,
    "port": "443",
    "https": true,
    "ws": true,
    "isBehindProxy": false,
    "ssl_key": path.resolve(__dirname + "/../ssl/ssl.key"),
    "ca": path.resolve(__dirname + "/../ssl/ssl.ca"),
    "ssl_crt": path.resolve(__dirname + "/../ssl/ssl.crt")
});

function onstart() {

    var server = this;
    var jadeCache = {
        "/": {
            template: null,
            data: {}
        },
        "/search": {
            template: null,
            data: {}
        },
        "/item": {
            template: null,
            data: {}
        },
        "/list": {
            template: null,
            data: {}
        },
        "/categories": {
            template: null,
            data: {}
        },
        "/privacy-policy": {
            template: null,
            data: {}
        },
        "/terms-of-service": {
            template: null,
            data: {}
        },
        "/about": {
            template: null,
            data: {}
        }
    }

    server.jadeCache = jadeCache;
    server.userCache = {

        tokenIndex: {},
        users: {}

    };

    // Initialize cache
    require('./cache.js')(server, jadeCache);

    // Initialize gc
    require('./gc.js').call(server);

    // Requests per interval
    server.bouncer.config.GLOBAL_IP_PER_INTERVAL = 1500;

    // Force non-www
    this.Router.use(force('https://pazari-vivliou.gr'));

    // Block libwww-perl
    this.Router.use(function (req, res, next) {

        if (/libwww-perl/.test(req.get('user-agent'))) res.status(403).end(); else next();

    });

    // Redirect www
    this.Router.get('/*', function (req, res, next) {
        if (req.headers.host.match(/^www/) !== null) {
            res.redirect('https://' + req.headers.host.replace(/^www\./, '') + req.url);
        } else {
            next();
        }
    });

    // Log request
    this.Router.use('/*', function (req, res, next) {

        zx.log("HTTPS:[" + req.headers['user-agent'] + "][" + req.connection.remoteAddress + "]@" + new Date().getTime() + ": " + req.originalUrl);
        next();

    });

    // Redirect mobile urls
    this.Router.use(['/m', '/mobile'], function (req, res, next) {

        res.redirect('https://' + config.domain + '/');

    });

    // Cookie and Auth
    require('./req.auth.js')(this);

    // API
    require('./api/api.index.js')(this);

    // Search page
    require('./page.search.js')(this);

    // Item page
    require('./page.item.js')(this);

    // Category page
    require('./page.category.js')(this);

    // All categories
    require('./page.allCategories.js')(this);

    // All categories
    require('./page.static.js')(this);

    // Serve app
    this.Router.get('/', function (req, res, next) {

        res.setHeader("Cache-Control", "no-cache, must-revalidate");

        res.send(jadeCache["/"].template({
            baseUrl: '/',
            udata: res._userData,
            csrf: zx.newSession.call(server.auth),
            cartText: "Το καλάθι σας είναι άδειο",
            loginText1: "Σύνδεση",
            loginText2: "Εγγραφή",
            alias: require('./alias.js'),
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

    // Always add cache control header
    this.Router.use(function (req, res, next) {
        res.setHeader("Cache-Control", "max-age=31104000, public");
        res.setHeader('Expires', new Date(Date.now() + 345600000).toUTCString());
        return next();
    });

    // Proxy biblionet images
    this.Router.get('/images/**/*', function (req, res, next) {

        require('http').request({
            hostname: 'biblionet.gr',
            method: 'get',
            path: req.path
        }, function (imgRes) {

            imgRes.pipe(res);

            imgRes.on('error', function () {

                this.emit('end');

            });

            imgRes.on('end', function () {

                this.destroy();

            });

        }).end();

    });

    //server.api.core = require(path.resolve(__dirname + '/../api/core.js'));

    // Serve static content in assets folder as is
    this.Router.use(express.static(__dirname + '/../assets'));

}

global.appServer.onstart = onstart;

global.price = function (price, marketPrice) {

    var finalPrice = "";

    marketPrice = parseFloat(marketPrice);
    price = parseFloat(price);

    finalPrice = marketPrice && (parseFloat(marketPrice) < (parseFloat(price)*.80 || Infinity)) ? Math.round(parseFloat(marketPrice) * .95 * 100) / 100 : Math.round(price * .80 * 100) / 100;

    // Make sure there's 2 digits after decimal point
    return finalPrice + (String(finalPrice).split('.')[1] && String(finalPrice).split('.')[1].length != 2 ? '0' : '');

};