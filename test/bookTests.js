/* global searchCast */
/* global fetchBookByBnid */
/* global config */
/* global gen */
'use strict';

const BOOK_ID = 203362;
const AUTHOR_ID = 16239;

global.config = require('./../config.json');

config.main.taskServerPort = 8967;

global.appServer = { 
    jadeCache: { 
        "/item": { data: {} },
        "/search": { data: {} } 
    } 
};

global.sitemap = { addSearch: () => {} };
global.http = require('http');
global.log = msg => console.log(msg.yellow);

var l = (msg, color) => console.log(msg[color]);
var mongodb = require('mongodb');
var connectToDb = () => new Promise(resolve =>
    mongodb.connect("mongodb://" + config.mongodb.ip + ":" + config.mongodb.port + "/" + config.mongodb.database, (err, db) => resolve([err, db])));

require('colors');
require('./../src/utils/gen');
require('./../src/utils/alias');
require('./../src/search/search.scrapAuthorByBnid');
require('./../src/search/search.getBooksFromUrl');
require('./../src/search/search.fetchBookByBnid');
require('./../src/search/search.scrapBookMeta');
require('./../src/search/search.getExtraInfo');
require('./../src/search/search.cast');

gen(function*(){
    
    l('Starting book tests...', 'green');
    l('Connecting to mongodb on ' + config.mongodb.ip + ":" + config.mongodb.port + "/" + config.mongodb.database, 'green');
       
    appServer.db = (yield connectToDb())[1];
    
    if(appServer.db) 
        l('Connected.', 'green');
    else
        return l('Failed to connect to mongodb.', 'red');
    
    var book = (yield fetchBookByBnid(BOOK_ID))[1];
    
    if(book.bnid) 
        l('Book fetched.', 'green');
    else
        return l('Failed to fetch book.', 'red');
    
    l('Fetching book meta...', 'green');
        
    var bookMeta = yield scrapBookMeta(BOOK_ID);
    
    if(bookMeta.bnid) 
        l('Book meta fetched.', 'green');
    else
        return l('Failed to fetch book meta.', 'red');
        
    l('Casting search with keyword...', 'green');
    
    var searchResults = yield searchCast({

        query: 'ΙΣΤΟΡΙΕΣ ΓΙΑ ΚΑΛΗΝΥΧΤΑ',
        inCategory: null,
        page: 1

    });
        
    console.log(searchResults);
        
});
