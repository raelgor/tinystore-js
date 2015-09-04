var GC_INTERVAL = 1000 * 39; // minutes
var MAX_SEARCH_CACHE = 20000;
var MAX_ITEM_CACHE = 20000;

// delete this many more to get some space
var DEL_OFFSET = 500;

module.exports = function () {

    var server = this;

    setInterval(function () {

        var cache = server.jadeCache;

        gc(cache["/search"].data, MAX_SEARCH_CACHE, "renewed");
        gc(cache["/item"].data, MAX_ITEM_CACHE, "requests");

        function gc(index, limit, key) {

            if (Object.keys(index).length < limit) return;

            var delCount = Object.keys(index).length - limit + 100;
            var delPool = [];
            var delI = 0;

            for (var i in index) {

                var obj = { key: i }

                obj.d = index[i][key];

                delPool.push(obj);

            }

            delPool.sort(function (a, b) { return a.d - b.d;  });

            delPool.forEach(function (obj) { if(delI++ < delCount) delete index[obj.key]; });

            log('\033[0;33m[GC] killed ' + delCount + ' in ' + key);

        }

    }, GC_INTERVAL);

}