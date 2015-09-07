// Returns an array of book objects from
// an array of bnids
global.getBooksByBnids = function (bnids) {

    return gen(function* x () { 

        for(var index in bnids)
            yield fetchBookByBnid.call(appServer, bnids[index]);
        
    });
    
    // Above code needs --harmony

    /* 
    return new Promise(function (resolve, reject) {

        var promiseBuffer = [];

        bnids.forEach(function (bnid) {
            promiseBuffer.push(fetchBookByBnid.call(appServer, bnid));
        });

        Promise.all(promiseBuffer).then(resolve);

    });
    */

    // Test
    // getBooksByBnids(['13548','138160']).then(function(data){ console.log(data); });

}