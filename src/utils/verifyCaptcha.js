global.verifyCaptcha = function (rkey, ip) {

    return new Promise(function (resolve, reject) {

        var rdata = querystring.stringify({
            secret: RCP_KEY,
            response: rkey,
            remoteip: ip
        });

        var request = https.request({
            hostname: 'www.google.com',
            method: 'post',
            path: '/recaptcha/api/siteverify',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(rdata)
            }
        }, function (response) {

            var data = "";

            response.on('data', function (c) { data += c; });

            response.on('error', reject);

            response.on('end', function () {

                try {

                    JSON.parse(data).success && resolve();

                } catch (e) { reject(); };

            });

        });

        request.on('error', reject);

        request.write(rdata);

        request.end();

    });

}