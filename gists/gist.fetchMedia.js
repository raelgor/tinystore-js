/*
** Iterates through a collection and fetches
** images from a domain
*/
'use strict';

const DOMAIN = 'www.biblionet.gr';
const INTERVAL = 1500;
const INCLUDE_FILE = ''; // 'images_that_failed_to_download.dat'; // 'failed_ids.dat';
const DB_CRED = 'mongodb://127.0.0.1:27017/general_purpose';
const DB_COLL = 'persons';
const IMG_KEY = 'img';

var downloadedTotal = 0;
var personsImages = 0;
var bookImages = 0;
var totalEntries = 0;
var entryNum = 0;
var failed = 0;

var co = require('co');
var fs = require('fs');
var path = require('path');
var get = require('http').get;
var mongodb = require('mongodb');
var config = require('../config.json');

var failStream = fs.createWriteStream('failed_ids.dat');
var includeIDs = INCLUDE_FILE && fs.readFileSync(INCLUDE_FILE);

require('colors');

co(function*() {
    
    var conn = yield new Promise(resolve => mongodb.connect(DB_CRED, (err, db) => resolve([err, db])));
    var db = conn[1];
    var collection = db.collection(DB_COLL);
    var query = {};
    
    if(includeIDs)
        query = { bnid: { $in: includeIDs.toString('utf8').split('\n').map(n => { return +n }) } };
    
    setInterval(() => co(function*() { 
        totalEntries = yield new Promise(resolve => collection.find(query).count((err, num) => resolve(num))); 
    }), 1000);

    collection.find(query, (err, cursor) => {
        
        var processNext = (err, item) => {
            
            if(!item) return;
            
            entryNum++;
        
            if(item[IMG_KEY]) {
                
                let url = 'http://' + DOMAIN + item.img;
                let filename = item.img.split('/').pop();
                let filepath = path.resolve(__dirname, '../cache/' + filename);
                
                let handler = response => { 
                    
                    let downloading;
                    
                    if(~response.headers['content-type'].indexOf('image') && response.statusCode === 200){
                        
                        downloading = true;
                        
                        try { fs.unlinkSync(filepath); } catch(err) {}
                        
                        let stream = fs.createWriteStream(filepath);
                        response.pipe(stream); 
                        
                    } else {
                        
                        failed++;
                        failStream.write(item.bnid + '\n');
                        
                    }
                    
                    response.on('end', () => downloading && downloadedTotal++);
                    
                }
                
                get(url, handler);
                
            } 
            
            setTimeout(iterate, INTERVAL);
            
        }
        
        var iterate = () => cursor.nextObject(processNext);
        
        iterate();
        
    });
    
});

setInterval(() =>
    process.stdout.write("\r\x1b[K" + [
        '',
        'DOWNLOADED:'.yellow    + downloadedTotal,
        'FAILED:'.yellow        + failed,
        'INDEX:'.yellow         + entryNum,
        'TOTAL:'.yellow         + totalEntries,
        'RSS:'.yellow           + Math.ceil(process.memoryUsage().rss/1024/1024) + 'M'.gray,
        'PROGRESS:'.yellow      + Math.floor(entryNum/totalEntries*1e3)/10 + '%'.gray,
        ''
    ].join('|'.cyan))
, 300);