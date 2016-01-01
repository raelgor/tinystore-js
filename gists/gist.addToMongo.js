/* global gen */
'use strict';

var inserted = 0;
var invalid = 0;
var upsertFailed = 0;
var total = 0;
var dataAvail = {};

var fs = require('fs');
var mongodb = require('mongodb');

require('../src/utils/gen');
require('colors');

var init = (err, db) => {
    
    let collection = db.collection('books');    
    let files = fs.readdirSync('tmp');
    
    total = files.length;
    
    gen(function*(){
        
        for(let file of files) try {
            
            let json = fs.readFileSync('tmp/' + file);
            
            json = JSON.parse(json.toString('utf8'));
            
            for(let key in json)
                dataAvail[key] = dataAvail[key] ? ++dataAvail[key] : 1;
            
            yield new Promise(resolve => collection.update(
                { bnid: json.bnid }, 
                { $set: json }, 
                { upsert: true }, 
                (err, msg) => {
                    err ? upsertFailed++ : inserted++;
                    resolve();
                }));
            
        } catch (err) { invalid++ }
            
        fs.writeFileSync('stats.json', JSON.stringify(dataAvail));    
    
    });
    
}

mongodb.connect('mongodb://127.0.0.1:27017/general_purpose', init);

setInterval(() =>
    process.stdout.write("\r\x1b[K" + [
        '',
        'INSERTED:'.yellow + inserted,
        'INVALID:'.yellow  + invalid,
        'TOTAL:'.yellow    + total,
        'UPFAILED:'.yellow + upsertFailed,
        'RSS:'.yellow      + Math.ceil(process.memoryUsage().rss/1024/1024) + 'M'.gray,
        'PROGRESS:'.yellow + Math.floor(inserted/total*1e3)/10 + '%'.gray,
        ''
    ].join('|'.cyan))
, 300);