var http = require('http');
var express = require('express');
var config = require('./../../config.json');
var server = express();

process.title = 'bs-task-cluster';

var requestBuffer = [];

var logging = 1;

server.get('/extra/**/*', function (req, res) {

    var isbn = req.path.split('/')[2];
    var bnid = req.path.split('/')[3];
    var d = new Date().getTime();

    getMarketPrice(isbn, bnid).then(function (price) {

        log('extra info for ' + isbn + ' got after ' + (new Date().getTime() - d) + ' (' + price + '). ' + requestBuffer.length + ' remaining...');

        http.request({

            host: config.main.ip,
            method: 'get',
            port: config.main.taskServerPort,
            path: '/extra/' + price + '/' + bnid

        }, function (response) {

        }).end();

    });

    res.send('');

});

http.createServer(server).listen(config.fetcher.port, config.fetcher.ip);

var log = function (str) {

    if (!logging) return;

    var prep = "\033[0m[debug]\033[33m ";

    console.log(prep + str + "\033[0m");

}

log('server v2 started. waiting for requests...');

function getMarketPrice(isbn, bnid) {

    return new Promise(function(resolve, reject){

        requestBuffer.push({
            
            bnid: bnid,
            isbn: isbn,
            resolve: function (p) { resolve(p); }
        
        });
    
    });
    
}

setInterval(function () {

    try {

        var rdata = requestBuffer.shift();

        if (!rdata) return;

        var path = '/index.php?category_id=&page=shop.browse&option=com_virtuemart&Itemid=89&limitstart=0&advanced=1&keyword1=&keyword1method=0&keyword2=&keyword2method=0&writerid=-1&edWriter=&epimid=-1&edEpimelitis=&metfid=-1&edMetafrastis=&illustratorid=-1&edIllustrator=&publisherid=-1&edPublisher=&isbn=' +
                rdata.isbn.split('-').join('').trim()
                + '&pcode=&langFilter=-1';

        var req = http.request({

            host: config.fetcher.targetDomain,
            method: 'get',
            path: path,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                // 'Accept-Encoding': 'gzip, deflate, sdch',
                'Accept-Language': 'en,el;q=0.8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Host': config.fetcher.targetDomain,
                'Pragma': 'no-cache',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36'
            }

        }, function (res) {

            res.setEncoding('utf8');

            var data = "";

            res.on('data', function (c) { data += c; });
            res.on('error', function (e) { console.log('response error ' + e); rdata.resolve() });

            res.on('end', function () {

                var price;

                try {
                    
                    price = data.split('id="vmMainPage"')[1].split('id="statusBox"')[0].split('class="productPrice">')[1].split('&euro;')[1].split('</span>')[0].trim();

                    data.split('browse-page-block"').length > 2 && (price = undefined);

                } catch (err) { log(err); }

                rdata.resolve(price);

            });

        });

        req.on('error', function (e) { log('request error ' + e); rdata.resolve(); });
        req.end();

    } catch (err) { }

}, 2500);