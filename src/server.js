var path = require('path');
var force = require('express-force-domain');
var express = require('express');

global.appServer = new zx.Server({
    "db_type": "mongodb",
    "db_host": "mongodb://" + nw + ":27017/_eshop_bookstore",
    "db_user": "",
    "db_pass": "",
    "bind": nw,
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
        },
        "/cart": {
            template: null,
            data: {}
        },
        "/wishlist": {
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
    this.Router.use(force('https://' + config.domain));

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

    // Pages
    require('./pages/page.search.js')(this);
    require('./pages/page.item.js')(this);
    require('./pages/page.category.js')(this);
    require('./pages/page.allCategories.js')(this);
    require('./pages/page.static.js')(this);
    require('./pages/page.cart.js')(this);
    require('./pages/page.index.js')(this);
    require('./pages/page.wishlist.js')(this);

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

    // Serve static content in assets folder as is
    this.Router.use(express.static(__dirname + '/../assets'));

}

global.appServer.onstart = onstart;