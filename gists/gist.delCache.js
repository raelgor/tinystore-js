'use strict';

var fs = require('mz/fs');
var co = require('co');

co(function*(){
    
    var dir = yield fs.readdir('./cache.old');
    var c = 0;
    
    for(let file of dir) {
    
        yield fs.unlink('./cache.old/' + file);
        console.log(++c);
    
    }
    
});