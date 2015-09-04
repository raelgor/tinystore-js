var child_process = require('child_process');
var child;
var log = global.log;

var addQueue = [];

log('sitemap starting...');

module.exports = {

    addSearch: function (searchObj) {
        
        if (!searchObj.isCat) return;

        var catid = searchObj.term.split('::')[1];
        var server = this;

        server.db.collection('bnBooks').find({
            bnid: {
                $in: searchObj.bnIDs
            }
        }, { bnid: 1, title: 1 }).toArray(function (err, data) {

            data.length && (searchObj.bnIDs = data);

            server.db.collection('bnCategories').find({ bnid: catid }, { bnid: 1, title: 1 }).toArray(function (err, data) {

                searchObj.cat = data[0] || {};

                child.send({
                    cmd: 'queue',
                    msg: JSON.stringify(searchObj)
                });

            });

        });

    }

};

(function startChild() {

    log('starting sitemap child process...');

    if (child) {

        child.kill('SIGKILL');
        child = undefined;

    }

    child = child_process.fork('./src/sitemap.child.js');

    child.on('message', function (msg) {

        msg.cmd == 'log' && zx.log('\033[0;32m[SITEMAP_CHILD_PROCESS] ' + msg.msg);

    });

    child.on('disconnect', function () {

        log('sitemap child disconnected.');
        startChild();

    });

})();