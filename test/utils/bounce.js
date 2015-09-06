var assert = require("assert");

require('../../src/utils/bounce.js');

describe('Bounce', function() {
    // Do nothing while calling setTimeout
    bounce.setTimeout = function(fn_, time_) { };
    
    // Adds new default bouncing rule
    bounce({
        // The rule applies if the $match
        // pattern matches
        $match: {
            request: "login",
            foo: "right"
        },
        // These values of the request
        // will be added to its identifier
        $include: {
            username: 1
        }
    })
    
    // Adds new non-default bouncing rule
    bounce({
        // The rule applies if the $match
        // pattern matches
        $match: {
            request: "logout"
        },
        // These values of the request
        // will be added to its identifier
        $include: {
            username: 2
        }
    })
    // Blacklist these requests when we've had 101
    // of them in 10.001 seconds for 10.002 seconds
    .on(101).over(10001).for(10002);
    
    describe('internal state after creation', function () {
        it('should be as expected', function () {
            assert.equal(2, bounce.requestPatterns.length);
    
            // Checking default
            var dut = bounce.requestPatterns[0];
            assert.equal(100, dut._on);
            assert.equal(10000, dut._over);
            assert.equal(10000, dut._for);
            assert.deepEqual({ request: 'login', foo: 'right' }, dut.pattern.$match);
            assert.deepEqual({ username: 1 }, dut.pattern.$include);     
    
            // Checking overrides
            var dut = bounce.requestPatterns[1];
            assert.equal(101, dut._on);
            assert.equal(10001, dut._over);
            assert.equal(10002, dut._for);
            assert.deepEqual({ request: 'logout' }, dut.pattern.$match);
            assert.deepEqual({ username: 2 }, dut.pattern.$include);
        });
    });
    
    describe('#getPatternFromRequestObject()', function () {
        it('should match patterns with two keys', function () {
            var testObject = { request: "login", foo: "right", username: "kosmas" };
            assert.equal(bounce.requestPatterns[0], bounce.getPatternFromRequestObject(testObject));
        });
        
        it('shouldn\'t match patterns that don\t exist', function () {
            var testObject = { request: "login", foo: "right2", username: "kosmas" };
            assert.equal(false, bounce.getPatternFromRequestObject(testObject));
        });

        it('should match patterns with one key', function () {
            var testObject = { request: "logout", username: "kosmas" };
            assert.equal(bounce.requestPatterns[1], bounce.getPatternFromRequestObject(testObject));
        });
    });
    
    describe('#getIdFromRequestObject()', function () {
        it('should create valid strings for patterns with two keys', function () {
            var testObject = { request: "login", foo: "right", username: "kosmas" };
            assert.equal("request::login::foo::right::username::kosmas", bounce.getIdFromRequestObject(testObject));
        });
        
        it('should return false for requests that don\'t match any pattern', function () {
            var testObject = { request: "login", foo: "right2", username: "kosmas" };
            assert.equal(false, bounce.getIdFromRequestObject(testObject));
        });
        
        it('should create valid strings for patterns with one key', function () {
            var testObject = { request: "logout", username: "kosmas" };
            assert.equal("request::logout::username::kosmas", bounce.getIdFromRequestObject(testObject));
        });
    });

    describe('#check()', function () {
        var testObject = { request: "login", foo: "right2", username: "kosmas" };
            
        it('for invalid objects, by default it should return true', function () {
            assert.equal(true, bounce.check(testObject));
        });
        
        it('for invalid objects, it should return false when defined so by using onUnknown()', function () {
            bounce.onUnknown(false)
            assert.equal(false, bounce.check(testObject));
        });
        
        it('should work as expected while restoring original behaviour', function () {
            // Restore original
            bounce.onUnknown(true)
            assert.equal(true, bounce.check(testObject));
        });
        
        it('should ban more than 100 calls under the first rule', function () {
            bounce.resetMonitorStatus(); 
            
            var myCallbacks = [];
            bounce.setTimeout = function(fn_, time_) { myCallbacks.push({callback: fn_, time: time_}); }
            
            var spam = { request: "login", foo: "right", username: "kosmas" };

            for (var i = 0; i < 200; ++i)
            {
                assert.equal(i < 100, bounce.check(spam));
            }

            // One callback for the first 100 calls + one to delete the blacklist
            assert.equal(101, myCallbacks.length);
        });
        
        it('should ban more than 101 calls under the second rule + full functional test', function () {
            bounce.resetMonitorStatus(); 
            
            var myCallbacks = [];
            bounce.setTimeout = function(fn_, time_) { myCallbacks.push({callback: fn_, time: time_}); }
            
            var spam = { request: "logout", username: "kosmas" };

            for (var i = 0; i < 200; ++i) {
                assert.equal(i < 101, bounce.check(spam));
            }

            // One callback for the first 100 calls + one to delete the blacklist
            assert.equal(102, myCallbacks.length);
            
            // If we remove the blacklist...
            var clearBlacklist = myCallbacks.pop().callback;
            clearBlacklist();
            
            // It won't really pass because non of the spams has really expired
            // in the meanwhile.
            assert.equal(false, bounce.check(spam));
            clearBlacklist = myCallbacks.pop().callback;
            
            // Let's expire 5 items...
            for (var i = 0; i < 5; ++i) {
                myCallbacks.pop().callback();
            }
            
            // Now let's clear the blacklist.
            clearBlacklist();
            
            // I should get 5 more trues and then a false.
            assert.equal(true, bounce.check(spam));
            assert.equal(true, bounce.check(spam));
            assert.equal(true, bounce.check(spam));
            assert.equal(true, bounce.check(spam));
            assert.equal(true, bounce.check(spam));
            assert.equal(false, bounce.check(spam));
        });
    });
});
