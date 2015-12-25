/* global zx */
/* global config */
'use strict';

var zenx = require('zenx');
var mkdirp = require('mkdirp');
var argvs = {};

process.title = 'bs-cluster';

// Make sure temp and log dirs exist
mkdirp('./cache');
mkdirp('./logs/debug');
mkdirp('./logs/errors');
mkdirp('./logs/events');
mkdirp('./logs/requests');
mkdirp('./logs/sessionStats');

// Load commonly used modules
global.http = require('http');
global.https = require('https');

global.config = require('./config.json');

// Detect internal IP
global.nw = config.main.ip ||
            require('os').networkInterfaces().eth0[0].address;

zx.log('Default IP: ' + global.nw);

// Index process arguments
process.argv.forEach(function (key) { argvs[key] = 1; });

global.mongodb = require('mongodb');
global.ObjectID = require('mongodb').ObjectID;
global.bodyParser = require('body-parser');
global.pwh = require('password-hash');

global.querystring = require('querystring');

// Load models
require('./src/models/model.CacheObject.js');
require('./src/models/model.SessionToken.js');
require('./src/models/model.User.js');
require('./src/models/model.MailOptions.js');

// Load utils
require('./src/utils/price.js');
require('./src/utils/verifyCaptcha.js');
require('./src/utils/log.js');
require('./src/utils/alias.js');
require('./src/utils/bounce.js');
require('./src/utils/getBooksByBnids.js');
require('./src/utils/gen.js');
require('./src/utils/logger.js');

// Load SMTP transporter object
require('./src/email/email.index.js');

// Load search scrappers
require('./src/search/search.cast.js');
require('./src/search/search.fetchBookByBnid.js');
require('./src/search/search.getBooksFromUrl.js');
require('./src/search/search.getExtraInfo.js');
require('./src/search/search.scrapAuthorByBnid.js');
require('./src/search/search.scrapBookMeta.js');

// reCAPTCHA key
global.RCP_KEY = config.grecaptcha.key;

// Facebook backend JS SDK
global.FB = require('fb');

// Enables analytic logs
global._debug = "--debug" in argvs;

// Sitemap generator
global.sitemap = require('./src/sitemap.js');

// Redirect server on :80
require('./src/redirect.js');

// App server on :443
require('./src/server.js');

// CMS server on :10000
require('./src/cms.js');