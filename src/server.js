/* global requestsLogFile */
/* global config */
/* global zx */
/* global sessionStats */
'use strict';

var path = require('path');
var force = require('express-force-domain');
var express = require('express');
var fs = require('fs');

global.appServer = new zx.Server({
    "db_type": "mongodb",
    "db_host": "mongodb://" + config.mongodb.ip + ":" + config.mongodb.port + "/" + config.mongodb.database,
    "db_user": "",
    "db_pass": "",
    "bind": config.main.ip,
    "port": config.main.httpsPort,
    "https": true,
    "ws": true,
    "isBehindProxy": false,
    "ssl_key": path.resolve(__dirname + "/../ssl/ssl.key"),
    "ca": path.resolve(__dirname + "/../ssl/ssl.ca"),
    "ssl_crt": path.resolve(__dirname + "/../ssl/ssl.crt")
});

function onstart() {

    var server = this;
    var jadeCache = {}
    
    for(let item of [
        "/",
        "/search",
        "/item",
        "/list",
        "/categories",
        "/privacy-policy",
        "/terms-of-service",
        "/about",
        "/cart",
        "/wishlist"
    ]) jadeCache[item] = {
        template: null,
        data: {}
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
    this.Router.use('/*', (req, res, next) => {

        let ua = req.headers['user-agent'];
        let ip = req.connection.remoteAddress;
        let ts = new Date().getTime();
        let path = req.originalUrl;
        
        let reqInfo = {
            protocol: 'https',
            path,
            ua, 
            ip,
            ts
        }
        
        sessionStats.httpsRequests++;
        sessionStats.totalRequests++;
        
        !ua && sessionStats.noUA++;
        /Googlebot/.test(ua) && sessionStats.googlebot++;
        /facebook/.test(ua) && sessionStats.facebookbot++;
        
        requestsLogFile.write(JSON.stringify(reqInfo) + '\n');

        zx.log("HTTPS:[" + ua + "][" + ip + "]@" + ts + ": " + path);
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
        
        sessionStats.imageRequests++;
        
        var filepath = req.path.replace(/\?.*$/,'');
        var filename = filepath.match(/\/([a-z0-9\.\-]*)$/i,'')[1];
        var cacheFilepath = path.resolve(__dirname, './../cache/' + filename)
        
        fs.stat(cacheFilepath, (err, stats) => {
            
            if(!err) { 
                
                let fileStream = fs.createReadStream(cacheFilepath);
                fileStream.pipe(res);
                
            } else require('http').request({
                hostname: 'www.biblionet.gr',
                method: 'get',
                path: filepath
            }, function (imgRes) {
                
                var cacheStream = fs.createWriteStream(cacheFilepath);
                
                imgRes.pipe(res);
                
                // @todo Investigate
                // imgRes.pipe(cacheStream);

                imgRes.on('error', function () {

                    this.emit('end');

                });

                imgRes.on('end', function () {

                    this.destroy();

                });

            }).end();
            
        });

    });

    // Serve static content in assets folder as is
    this.Router.use(express.static(__dirname + '/../assets'));

}

global.appServer.onstart = onstart;