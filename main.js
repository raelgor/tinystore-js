var zenx = require('zenx');
var argvs = {};

global.config = require('./config.json');

global.mongodb = require('mongodb');
global.ObjectID = require('mongodb').ObjectID;
global.bodyParser = require('body-parser');
global.pwh = require('password-hash');

global.querystring = require('querystring');

var nodemailer = require('nodemailer');

// create reusable transporter object using SMTP transport
global.mailTransporter = nodemailer.createTransport({
    service: config.email.service,
    auth: {
        user: config.email.user,
        pass: config.email.pass
    }
});

// reCAPTCHA key
global.RCP_KEY = config.grecaptcha.key;

global.http = require('http');
global.https = require('https');

global.FB = require('fb');

process.argv.forEach(function (key) { argvs[key] = 1; });

// Enables analytic logs
global._debug = "--debug" in argvs;

// Debug log
global.log = require('./src/debug.log.js');

// Detect internal IP
global.nw = require('os').networkInterfaces().eth0[0].address;
zx.log('Default IP: ' + global.nw);

// Sitemap generator
global.sitemap = require('./src/sitemap.js');

// Redirect server on :80
require('./src/redirect.js');

// App server on :443
require('./src/server.js');

// CMS server on :10000
require('./src/cms.js');