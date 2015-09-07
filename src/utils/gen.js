// A generator runner for standard Promises
global.gen = function (generator, returnOnlyLast) {

    return new Promise(function (resolve) {

        var gen = generator();
        var buffer = [];
        var last;

        (function iterate(value) {

            last = gen.next(value);

            !returnOnlyLast && buffer.push(value);

            if (last.done) return resolve(returnOnlyLast ? last.value : buffer);

            last.value.then(iterate, iterate);

        })();

    });
    
}