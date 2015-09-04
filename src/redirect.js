var express = require('express');
var force = require('express-force-domain');
var redirServer = express();

redirServer.use(force('https://pazari-vivliou.gr'));
redirServer.all('*', function (req, res) {

    res.redirect("https://" + req.headers.host + req.url);

});

require('http').createServer(redirServer).listen(80, global.nw);