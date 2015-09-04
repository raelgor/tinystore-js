var http = require('https');
var index = [];
var visited = {};
var rps = 0;
var r = 0;

var i = 0;

var argvs = {};
process.argv.forEach(function (key) { argvs[key] = 1; });

var GET_IMAGES = "--images" in argvs;
var GET_ITEMS = "--items" in argvs;
var GET_CATEGORIES = "--categories" in argvs;

console.log('starting...');

(function getUrl(path, single) {

    if (!path) return console.log('waiting...');

    if ((path in visited) && path != '/') return getUrl(index.shift());

    i++;

    !single && (visited[path] = 1);

    var ts;
    var bytes = 0;

    r++;

    var req = http.request({
        hostname: 'pazari-vivliou.gr',
        method: 'get',
        path: path
    }, function (res) {

        var data = '';

        res.on('data', function (c) { data += c; bytes += c.length; });

        res.on('error', next);

        res.on('end', function () {

            if (single) return next();;

            try {

                if (GET_CATEGORIES) {

                    var shards = data.split('/list/');

                    shards.shift();

                    shards.forEach(function (c) {

                        var path = c.split('"')[0];
                        /^[0-9]*\/(.)*$/.test(path) && index.push('/list/' + path);

                    });

                }

                if (GET_ITEMS) {

                    shards = data.split('/item/');

                    shards.shift();

                    shards.forEach(function (c) {

                        var path = c.split('"')[0];
                        /^[0-9]*\/(.)*$/.test(path) && index.push('/item/' + path);

                    });

                }

                if (GET_IMAGES) {

                    shards = data.split('/images/');
                    shards.shift();

                    shards.forEach(function (c) {
                        getUrl('/images/' + c.split('"')[0], true);
                    });

                }

            } catch (err) {  }

            next();

        });

    });

    req.on('error', next);

    function next() {

        console.log('------------------------------------------');
        console.log('getting[' + i + '][' + rps + 'rps]: ' + path);
        console.log('[' + (new Date().getTime() - ts) + 'ms][' + parseInt(bytes / 1000) + 'KB]');

        if (single) return;

        getUrl(index.shift());

    }

    setTimeout(function () {

        ts = new Date().getTime();
        req.end();

    }, 0);

    return getUrl;

})('/')('/')('/')('/')('/')('/')('/')('/')('/'); // max: 4

setInterval(function () {

    rps = parseInt(r / 2);
    r = 0;

}, 2000);