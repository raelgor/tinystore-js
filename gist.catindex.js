var mongo = require('mongodb');
var fs = require('fs');

// pending request counter
var pending = 0;

// data pool
var catData = [];

var completedIndex = {}

console.log('started. connecting to mongodb...');

mongo.connect("mongodb://104.155.34.95:27017/_eshop_bookstore", function (err, db) {

    console.log('mongodb connected. starting writechain...');
    var c = db.collection('bnCategories');
    
    // recursive function
    (function write(catObj) {

        if (catObj) {

            var parent;

            catObj.forEach(function (cat) { assertUnique(cat.bnid) && catData.push(cat) });

            catObj.for && (parent = catData.filter(function (i) { return i && i.bnid == catObj.for })[0]);

            if (parent) {

                var bnids = [];

                catObj.forEach(function (i) { bnids.push(i.bnid); });

                parent.contents = bnids;

                // v1: insert
                // c.insert(parent);

                // v2: update
                // parent.title && (parent.title = parent.title.trim()) && c.update({ bnid: parent.bnid }, { $set: { title: parent.title } }, { upsert: true });

                // v3: update contents and upsert
                // parent.title 

                completedIndex[parent.bnid] = 1;

            }

            pending--;

        }

        !catObj && console.log('starting scrapping from /main.asp?page=index ...');

        catObj = catObj || [undefined];

        catObj.forEach(function (cat) {

            if (cat && cat.bnid && !assertIndexed(cat.bnid)) return;

            delay(function () { getSubCatsById(cat && cat.bnid).then(write, write); }, 100)

        });

        pending += catObj.length;

    })();

    function getSubCatsById(id) {

        var indexed;

        return new Promise(function (resolve, reject) {

            var catObjects = [];
            var http = require('http');

            var request = http.request({
                hostname: "biblionet.gr",
                method: 'get',
                path: id ? "/index/" + id : "/main.asp?page=index",
            }, function (response) {

                response.setEncoding('utf8');

                var data = "";

                response.on("data", function (c) { data += c; });

                response.on("end", function () {

                    try {

                        var startString = id ? data.split('/index/' + id)[1] : data;

                        var shards = startString ? startString.split('/index/') : [];

                        shards.shift();
                        shards.forEach(function (shard) {

                            var category = {}

                            try { category.bnid = shard.split('"')[0]; } catch (x) { }
                            try { category.title = shard.split('] ')[1].split(/[<\(]/)[0]; } catch (x) { }

                            category.bnid && catObjects.push(category);

                        });

                        catObjects.for = id;

                        if (!catObjects.length) return fail();

                        resolve(catObjects);

                        // count indexed records
                        indexed = catData.filter(function (i) { return i.contents; }).length;

                        console.log(indexed + ' indexed / ' + catData.length + " mapped ");

                    } catch (err) { fail(); }

                });

            });

            // If request had no valid results
            request.on('error', function () {

                console.log('--------- http error --------: ' + id);
                fail();

            });

            request.end();

            function fail() {

                var parent;

                // count indexed records
                indexed = catData.filter(function (i) { return i.contents; }).length;

                pending--;
                parent = catData.filter(function (i) { return i.bnid == id });

                parent[0].contents = [];

                //c.insert(parent);

                // Fix titles
                parent.title && (parent.title = parent.title.trim()) && c.update({ bnid: parent.bnid }, { $set: { title: parent.title } }, { upsert: true });

                console.log(indexed + ' indexed / ' + catData.length + " mapped ");

            }

        });

    }

    // hipster delay function
    function delay(fn, interval) {

        global._delay = global._delay || [];

        global._delay.push(fn);

        global._delay.interval = global._delay.interval || setInterval(function () {

            global._delay.length && global._delay.shift()();

        }, 200);

    }

    function assertIndexed(bnid) {

        var entry = catData.filter(function (i) { i.bnid == bnid; })[0];
        return entry && entry.contents ? false : true;

    }

    function assertUnique(bnid) {

        var entry = catData.filter(function (i) { i.bnid == bnid; })[0];
        return entry ? false : true;

    }

});

setInterval(function () { }, 10000000);
