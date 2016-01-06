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
global.socks = require('socks');
global.fs = require('fs');

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
require('./src/models/model.CacheObject');
require('./src/models/model.SessionToken');
require('./src/models/model.User');
require('./src/models/model.MailOptions');

// Load utils
require('./src/utils/price');
require('./src/utils/verifyCaptcha');
require('./src/utils/log');
require('./src/utils/alias');
require('./src/utils/bounce');
require('./src/utils/getBooksByBnids');
require('./src/utils/gen');
require('./src/utils/logger');
require('./src/utils/tor');

// Load SMTP transporter object
require('./src/email/email.index');

// Load search scrappers
require('./src/search/search.cast');
require('./src/search/search.fetchBookByBnid');
require('./src/search/search.getBooksFromUrl');
require('./src/search/search.getExtraInfo');
require('./src/search/search.scrapAuthorByBnid');
require('./src/search/search.scrapBookMeta');

// reCAPTCHA key
global.RCP_KEY = config.grecaptcha.key;

// Facebook backend JS SDK
global.FB = require('fb');

// Enables analytic logs
global._debug = "--debug" in argvs;

// Sitemap generator
global.sitemap = require('./src/sitemap');

// Redirect server on :80
require('./src/redirect');

// App server on :443
require('./src/server');

// CMS server on :10000
require('./src/cms');