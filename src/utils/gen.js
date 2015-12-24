// A generator runner for standard Promises
global.gen = (generator, returnOnlyLast) => {

    return new Promise((resolve) => {
        
        var gen = generator();
        var buffer = [];
        var last;

        (function iterate(value) {

            last = gen.next(value);

            !returnOnlyLast && buffer.push(value);

            if (last.done) return resolve(returnOnlyLast ? last.value : buffer);
            
            if(last.value.then)
                last.value.then(iterate, iterate);
            else
                iterate();
                  
        })();

    });
    
}