// Used to add patterns
global.bounce = function (requestPattern) {
    
    requestPattern = new bounce.RequestPattern(requestPattern);

    bounce.requestPatterns.push(requestPattern);

    return requestPattern;
}

// Wrap the pattern with this model to avoid conflicting with
// the on, over and for keys
bounce.RequestPattern = function (pattern) {
    // Default values
    this._on = 100;
    this._over = 10000;
    this._for = 10000;

    this.on = function (val) { this._on = val; return this; }
    this.over = function (val) { this._over = val; return this; }
    this.for = function (val) { this._for = val; return this; }

    this.pattern = pattern;

}

// Request indexes and pattern storage
bounce.requestPatterns = [];
bounce.requestIndex = {};
bounce.blacklistIndex = {};
bounce._onUnknown = true;

bounce.resetMonitorStatus = function () {
    this.requestIndex = {};
    this.blacklistIndex = {};
}

bounce.reset = function () {
    this.resetMonitorStatus();
    this.requestPatterns = [];
    this._onUnknown = true;
}

bounce.onUnknown = function (val) { bounce._onUnknown = val; }

// Factory callback set to default setTimeout. Override for testability.
// @todo Keep this in mind: http://stackoverflow.com/questions/12168708/is-there-any-limit-to-settimeout
bounce.setTimeout = setTimeout;

// Used to check requests
bounce.check = function (requestObject) {

    var requestID = this.getIdFromRequestObject(requestObject);
    var requestPattern = this.getPatternFromRequestObject(requestObject);

    // If unrecognized request, take the default action
    if (!requestID) return this._onUnknown;

    var blacklistIndex = this.blacklistIndex;

    // If requestID is banned, cut it
    if (requestID in blacklistIndex) return false;
    
    var requestIndex = this.requestIndex;
    
    // Make or load this request's record
    var record = requestIndex[requestID] || (requestIndex[requestID] = 0 );

    // If status is >= 1, add to blacklist
    if (record >= requestPattern._on) {

        blacklistIndex[requestID] = 1;

        // Clear from blacklist after pattern's for
        this.setTimeout(function () {
            delete blacklistIndex[requestID];
        }, requestPattern._for);

        return false;

    }

    // Update pool
    ++requestIndex[requestID];

    // Clear this request from pool after time specified by pattern
    this.setTimeout(function () {
        if(--requestIndex[requestID] == 0) delete requestIndex[requestID];
    }, requestPattern._over);

    // If we got here, pass
    return true;

}

// Used to find the pattern of a request
bounce.getPatternFromRequestObject = function (requestObject) {
    var result = false;
    
    this.requestPatterns.forEach(function (RequestPatternObject) {

        var pattern = RequestPatternObject.pattern;
        var success = true;

        // I think that an or-logic was required here - but
        // "and" logic is implemented instead
        for (var key in pattern.$match) {

            if (pattern.$match[key] != requestObject[key]) {

                success = false;

            }

        }
        
        if (!result && success) {
            result = RequestPatternObject;
        }
    });

    return result;

}

// Used to make an ID out of a request and its pattern
bounce.getIdFromRequestObject = function (requestObject) {

    var patternWrapper = this.getPatternFromRequestObject(requestObject);

    if (!patternWrapper) return false;
    
    var requestID = [];

    var pattern = patternWrapper.pattern;

    for (var key in pattern.$match) {

        requestID.push(key, pattern.$match[key]);

    }

    for (var key in pattern.$include) {

        requestID.push(key, requestObject[key]);

    }

    return requestID.join('::');

}
