var express = require('express');
var server = express();
var entries = {}

global.getExtraInfo = function (i) {

    var d = new Date().getTime();
    log('getExtraInfo ' + i.bnid + '...');

    return new Promise(function (res, rej) {

        function done() {

            log('getExtraInfo ' + i.bnid + ' resolved in ' + (new Date().getTime() - d) + 'ms');
            res(i);

        }

        if (!i.isbn && !i.isbn13) return done();

        var req = http.request({

            host: config.fetcher.ip,
            method: 'get',
            port: 8965,
            path: '/extra/' + (i.isbn13 || i.isbn) + '/' + i.bnid

        }, function (response) {

        });

        entries[i.bnid] = {

            item: i,
            resolve: function () { done() }

        }
            
        req.on('error', done);
        req.end();

    });

}

server.get('/extra/**/*', function (req, res) {

    var price = req.path.split('/')[2];
    var bnid = req.path.split('/')[3];

    price = price == "undefined" ? undefined : price;

    if (entries[bnid]) {

        entries[bnid].item.marketPrice = price;
        entries[bnid].item.marketPriceTS = new Date().getTime();
        entries[bnid].resolve();

        delete entries[bnid];
    
    }

    res.end();

});

http.createServer(server).listen(8965, nw);

log('extra info server started on 8965.')