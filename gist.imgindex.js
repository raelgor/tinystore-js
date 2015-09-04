var mongo = require('mongodb');
var fs = require('fs');
var ObjectID = require('mongodb').ObjectID;

var data = fs.readdirSync('./assets/media');

console.log('started. connecting to mongodb...');

mongo.connect("mongodb://104.155.34.95:27017/_eshop_bookstore", function (err, db) {

    console.log('mongodb connected. starting writechain...');

    var c = db.collection('Books');
    var i = 0;

    (function write(err) {

        var file = data[i];

        if (!file) return console.log('done');

        c.update(
            { _id: ObjectID(file.split('.')[0]) },
            {
                $set: { img: file }
            },
            { upsert: false }
            , write);

        console.log(i + ': ' + file.split('.')[0] + ': ' + file + ': ' + (!err ? 'success' : 'error'));

        i++;

        return write;

    })()()()();

});

setTimeout(function(){}, 10000000);