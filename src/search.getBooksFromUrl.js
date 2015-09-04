module.exports = function (url, cookies) {

    log('getBooksFromUrl: ' + url);

    return new Promise(function (resolve, rej) {

        var http = require('http');

        var request = http.request({
            hostname: "biblionet.gr",
            method: "GET",
            path: url,
            headers: {
                'Cookie': cookies || ''
            }
        }, function (res) {

            res.setEncoding('utf8');

            var data = "";

            res.on("data", function (c) { data += c; });

            res.on("end", function () {

                var sres = {};
                var resp;

                data.split('/book/').forEach(function (shard) {

                    var potentialID = parseInt(shard.split('/')[0]);

                    !isNaN(potentialID) &&
                    !(potentialID in sres) &&
                    (sres[potentialID] = 1);

                });

                resp = Object.keys(sres)
                resp.resNum = data.split(/Βρέθηκαν /)[1] ? data.split(/Βρέθηκαν /)[1].split(' ')[0] : 0;
                resp.ts = data.split('id="ts" name="timestart" value=')[1] && data.split('id="ts" name="timestart" value=')[1].split('>')[0];

                resp.cookies = res.headers['set-cookie'];

                log('getBooksFromUrl: end: ' + url);
                resolve(resp);

            });

        });

        request.end();

    });
    
}

