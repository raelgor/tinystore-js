/* global gen */
'use strict';

const NUM_OF_ENGINES = 2;
const START = 38167;
const SCRAP_TYPE = 'persons';
const DB_PATH = 'mongodb://127.0.0.1:27017/general_purpose';

require('./../src/utils/alias');
require('colors');

var scrappers = {
    'books': { file: './gist.scrap.books.js', collection: 'books', url: 'http://www.biblionet.gr/main.asp?page=showbook&bookid=' },
    'persons': { file: './gist.scrap.persons.js', collection: 'persons', url: 'http://www.biblionet.gr/main.asp?page=showauthor&personsid=' }
}

var i = START;
var saved = 0;
var e404 = 0;
var e403 = 0;
var eOther = 0;
var engines = NUM_OF_ENGINES;
var scrapper = scrappers[SCRAP_TYPE];

var fs = require('fs');
var co = require('co');
var http = require('http');
var mongodb = require('mongodb');

var failStream = fs.createWriteStream('failed_to_scrap_ids.dat');

var get = url => { return new Promise((resolve) => http.get(url, response => {
    
    let sc = response.statusCode;
    let error = sc !== 200;
    
    sc === 404 && e404++;
    sc === 403 && e403++;
    
    sc !== 404 && sc !== 403 && sc !== 200 && eOther++;
    
    response.setEncoding('utf8');
    
    let data = '';
    
    if(error)
        failStream.write(i + '\n');
    
    response.on('data', chunk => data += chunk);
    response.on('end', () => resolve(!error && data));
    
})); }

var scrap = (text, regex, endString) => { 

    let match;

    if(!endString) {
    
        match = text.match(regex);  
        match = match && match.pop() || undefined;
    
    } else {
        
        let startString = regex;
        
        match = text.split(startString)[1];
        match = match && match.split(endString)[0];    
        
    }
    
    return match;
    
}

function* engine(){
    
    var conn = yield new Promise(resolve => mongodb.connect(DB_PATH, (err, db) => resolve([err, db])));
    var db = conn[1];
    var collection = db.collection(scrapper.collection);
    
    while(++i) {
        
        var html = yield get(scrapper.url + i);
        
        // Test if found
        if(!html || !/\.\:BiblioNet/.test(html)) continue;
        
        var data = require(scrapper.file)(html, scrap, i);
        
        saved++;
        
        collection.update(
            { bnid: data.bnid }, 
            { $set: data }, 
            { upsert: true });
        
    }
    
}

// Start each engine one sec after the last
while(engines) 
    setTimeout(() => co(engine), engines--*1e3);
    
// Start fancy logger
setInterval(() =>
    process.stdout.write("\r\x1b[K" + [
        '',
        'SCRAPPED:'.yellow + saved,
        'INDEX:'.yellow    + i,
        'E404:'.yellow     + e404,
        'E403:'.yellow     + e403,
        'EOTHER:'.yellow   + eOther,
        'RSS:'.yellow      + Math.ceil(process.memoryUsage().rss/1024/1024) + 'M'.gray,
        'ENGINES:'.yellow  + NUM_OF_ENGINES,
        ''
    ].join('|'.cyan))
,300);