/* global sessionStats */
'use strict';

// Configuration
const SESSION_STATS_INTERVAL = 5000;

// Libs
var path = require('path');
var fs = require('fs');
var LOGS_PATH = path.resolve(__dirname, './../../logs');

// Initialize sessionStats
global.sessionStats = {
    sessionId: new Date().getTime() + process.hrtime().join(''),
    googlebot: 0,
    facebookbot: 0,
    imageRequests: 0,
    totalRequests: 0,
    noUA: 0,
    httpRequests: 0,
    httpsRequests: 0
}

// Global streams
global.requestsLogFile = 
    fs.createWriteStream(LOGS_PATH + '/requests/' + sessionStats.sessionId + '.log');

var logSessionStats = () => 
    fs.writeFile(
        LOGS_PATH + '/sessionStats/' + sessionStats.sessionId + '.json',
        JSON.stringify(sessionStats));

setInterval(logSessionStats, SESSION_STATS_INTERVAL);