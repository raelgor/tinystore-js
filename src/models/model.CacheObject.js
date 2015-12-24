global.CacheObject = function (bounds, obj, timeout) {

    var cacheObject = this;
    var TIMEOUT = timeout || 1000 * 60 * 60;

    this.obj = obj;
    this.used = 0;

    this.touch = function () {

        this.used++;
        this.renew();

    }

    this.renew = function () {

        clearTimeout(this.deletionInterval);
        this.deletionInterval = setTimeout(deleteSoon, TIMEOUT);

    }

    function deleteSoon() {

        bounds.forEach(function (bound) {

            delete bound.object[bound.key];

        });

    }

    bounds.forEach(function (bound) {

        bound.object[bound.key] = cacheObject;

    });

    this.addBound = function (bound) {

        bounds.push(bound);
        bound.object[bound.key] = cacheObject;

    }

    this.renew();

}