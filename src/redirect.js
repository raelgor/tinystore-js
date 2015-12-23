/* global config */
/* global requestsLogFile */
/* global sessionStats */
'use strict';

var express = require('express');
var force = require('express-force-domain');
var redirServer = express();

redirServer.use(force('https://' + config.domain));
redirServer.all('*', function (req, res) {
    
    let ua = req.headers['user-agent'];
    let ip = req.connection.remoteAddress;
    let ts = new Date().getTime();
    let path = req.originalUrl;
    
    let reqInfo = {
        protocol: 'http',
        path,
        ua, 
        ip,
        ts
    }
    
    sessionStats.httpRequests++;
    sessionStats.totalRequests++;
    
    requestsLogFile.write(JSON.stringify(reqInfo) + '\n');
        
    res.redirect("https://" + req.headers.host + req.url);

});

require('http').createServer(redirServer).listen(config.main.httpPort, config.main.ip);