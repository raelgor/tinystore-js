// Used to add patterns
global.bounce = function (requestPattern) {

    requestPattern = new bounce.RequestPattern(requestPattern);

    bounce.requestPatterns.push(requestPattern);

    return requestPattern;

}

// Wrap the pattern with this model to avoid conflicting with
// the on, over and for keys
bounce.RequestPattern = function (pattern) {

    this.on = function (val) { this._on = val; return this; }
    this.over = function (val) { this._over = val; return this; }
    this.for = function (val) { this._for = val; return this; }

    this.pattern = pattern;

}

// Request indexes and pattern storage
bounce.requestPatterns = [];
bounce.requestIndex = {};
bounce.blacklistIndex = {};

// Used to check requests
bounce.check = function (requestObject) {

    var requestID = this.getIdFromRequestObject(requestObject);
    var requestPattern = this.getPatternFromRequestObject(requestObject);

    var blacklistIndex = this.blacklistIndex;
    var requestIndex = this.requestIndex;

    // If unrecognized request, let it pass
    if (!requestID) return true;

    // If requestID is banned, cut it
    if (requestID in blacklistIndex) return false;

    // Make or load this request's record
    var record = requestIndex[requestID] || (requestIndex[requestID] = { status: 0, pool: 0 });

    // If status is >= 1, add to blacklist
    if (record.status >= 1) {

        blacklistIndex[requestID] = 1;

        // Clear from blacklist after pattern's for
        setTimeout(function () {
            delete blacklistIndex[requestID];
        }, requestPattern._for);

        return false;

    }

    // Update pool
    record.pool++;

    // Clear this request from pool after time specified by pattern
    setTimeout(function () {
        if(--record.pool == 0) delete requestIndex[requestID];
    }, requestPattern._over);

    // Update status
    record.status = record.pool / requestPattern._on;

    // If we got here, pass
    return true;

}

// Used to find the pattern of a request
bounce.getPatternFromRequestObject = function (requestObject) {
    
    var matchPattern;

    this.requestPatterns.forEach(function (RequestPatternObject) {

        var pattern = RequestPatternObject.pattern;
        var fail;

        for (var key in pattern.$match) {

            if (pattern.$match[key] != requestObject[key]) {

                fail = 1;

            }

        }

        matchPattern = !fail && RequestPatternObject;

    });

    return matchPattern || false;

}

// Used to make an ID out of a request and its pattern
bounce.getIdFromRequestObject = function (requestObject) {

    var patternWrapper = this.getPatternFromRequestObject(requestObject);
    var requestID = [];

    if (!patternWrapper) return false;

    var pattern = patternWrapper.pattern;

    for (var key in pattern.$match) {

        requestID.push(key, pattern.$match[key]);

    }

    for (var key in pattern.$include) {

        requestID.push(key, requestObject[key]);

    }

    return requestID.join('::');

}