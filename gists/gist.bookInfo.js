/* global gen */
'use strict';

const NUM_OF_ENGINES = 2;
const START = 175248;

require('./../src/utils/alias');
require('./../src/utils/gen');
require('colors');

var i = START;
var saved = 0;
var engines = NUM_OF_ENGINES;
var fs = require('fs');
var http = require('http');

var get = url => { return new Promise((resolve) => http.get(url, (response) => {
    
    response.setEncoding('utf8');
    
    let data = '';
    
    response.on('data', chunk => data += chunk);
    response.on('end', () => resolve(data));
    
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
    
    while(++i) {
        
        var html = yield get('http://www.biblionet.gr/main.asp?page=showbook&bookid=' + i);
        
        // Test if found
        if(!/\.\:BiblioNet/.test(html)) continue;
        
        var bookInfo = {
            
            bnid:         i,
            categories:   [],
            title:        scrap(html, /class\=\"book\_title\"\>\<strong\>(.*)\<\/strong\>/),
            description:  scrap(html, '<meta name="Description" content="', '">'),
            authorName:   scrap(html, '<br><br><a class=\'booklink\'href=main.asp?page=showauthor&personsid=13611>', '</a>'),
            price:        scrap(html, ' &euro; ', '<'),
            authorId:     scrap(html, /personsid\=([0-9]*)\>/),
            isbn:         scrap(html, 'ISBN ', /[,\, ]/),
            isbn13:       scrap(html, 'ISBN-13 ', /[,\, \[\<]/),
            year:         scrap(html, /class='book_details'>,[ ]*/, /[<>br \,]/),
            pages:        scrap(html, /\<br\>([ 0-9]*)σελ.\<br\>/),
            img:          scrap(html, /(\/images\/covers\/[a-z0-9]+\.[a-z]{3})/),
            translator:   html.split('μετάφραση: <a ')[1] && scrap(html.split('μετάφραση: <a ')[1], '>', '</a'),
            unavailable:  html.split("[Εξαντλημένο]").length > 1
            
        }
        
        for(let key in bookInfo)
            bookInfo[key] = bookInfo[key] && bookInfo[key].trim ? bookInfo[key].trim() : bookInfo[key];
            
        bookInfo.price = bookInfo.price && +bookInfo.price.replace(/\,/,'.');
        bookInfo.alias = bookInfo.title && alias(bookInfo.title);
        
        for(let numeric of [
        
            'pages',
            'price',
            'authorId',
            'year'
        
        ]) bookInfo[numeric] = isNaN(bookInfo[numeric]) ? undefined : +bookInfo[numeric];
        
        var _ = html.split('/main.asp?page=index&subid=');
        _.shift();
        _.forEach(function (shard) {

            var catBnid = shard.split('"')[0];

            /[0-9]*/.test(catBnid) && bookInfo.categories.push(String(catBnid));

        });
        
        saved++;
        fs.writeFile('tmp/' + i, JSON.stringify(bookInfo));
        
    }
    
}

while(engines) 
    setTimeout(() => gen(engine), engines--*1e3);
    
setInterval(() =>
    process.stdout.write("\r\x1b[K" + [
        '',
        'SCRAPPED:'.yellow + saved,
        'BNID:'.yellow     + i,
        'RSS:'.yellow      + Math.ceil(process.memoryUsage().rss/1024/1024) + 'M'.gray,
        'ENGINES:'.yellow  + NUM_OF_ENGINES,
        ''
    ].join('|'.cyan))
,300);