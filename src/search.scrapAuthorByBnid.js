module.exports = function (item) {

    var bnid = item.authorid;

    return new Promise(function (resolve, rej) {

        var http = require('http');

        var request = http.request({
            hostname: "biblionet.gr",
            method: "GET",
            path: "/author/" + bnid
        }, function (res) {

            res.setEncoding('utf8');

            var data = "";

            res.on("data", function (c) { data += c; });

            res.on("end", function () {

                try { item.authorimg = data.split(new RegExp("/images/persons/" + item.authorid))[1] && "/images/persons/" + item.authorid + ".jpg"; } catch (x) { };
                try { item.authordesc = data.split('<table width="780" border="0" cellspacing="0" cellpadding="5">')[1].split('justify>')[1].split('</p>')[0]; } catch (x) { console.log(x); };

                resolve(item);

            });

        });

        request.on('error', resolve);
        request.end();

    });

}