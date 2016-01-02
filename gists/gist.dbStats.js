/*
** Displays percentage of entries that contain each key
*/
'use strict';

const DB_PATH = 'mongodb://127.0.0.1:27017/general_purpose';
const DB_COLL = 'books';

var downloadedTotal = 0;
var personsImages = 0;
var bookImages = 0;
var totalEntries = 0;
var entryNum = 0;
var failed = 0;
var stats = {};

var co = require('co');
var fs = require('fs');
var path = require('path');
var get = require('http').get;
var mongodb = require('mongodb');

require('colors');

co(function*() {
    
    var conn = yield new Promise(resolve => mongodb.connect(DB_PATH, (err, db) => resolve([err, db])));
    var db = conn[1];
    var collection = db.collection(DB_COLL);
    
    totalEntries = yield new Promise(resolve => collection.count((err, num) => resolve(num)));
    
    collection.find({}, (err, cursor) => {
        
        var processNext = (err, item) => {
            
            if(!item){ 
                
                for(let key in stats) {
                
                    stats[key] = Math.floor(stats[key]/totalEntries*1e3)/10;
                
                    console.log(key.cyan + ': ' + stats[key] + '%'.gray);
                
                }
                
                return;
            
            }
            
            for(let key in item)
                stats[key] = stats[key] ? ++stats[key] : 1;
            
            iterate();
            
        }
        
        var iterate = () => cursor.nextObject(processNext);
        
        iterate();
        
    });
    
});