var queue = [];
var working;
var fs = require('fs');
var log = function (msg) { process.send({ cmd: 'log', msg: msg }); };
var config = require('./../config.json');

process.title = 'bs-smbuilder';

var defaultIndex = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://' + config.domain + '/sitemaps/base.xml</loc></sitemap></sitemapindex>';

log('sitemap child_process started (' + process.pid + ')');

var indexFile;

try { indexFile = String(fs.readFileSync('./assets/sitemaps/index.xml')); } catch (e) { }

require('./utils/alias.js');

log('sitemap indexFile loaded.');

process.on('message', function (msg) {

    //log('sitemap child_process obj received.');

    if(msg.cmd == 'queue') try {
        queue.push(JSON.parse(msg.msg));
    } catch (e) { log('sitemap message error: ' + e); };

});

setInterval(function () {

    !working && build();

}, 60000);

function build() {
    
    working = 1;
    var d = new Date().getTime();
    var added = 0;

    log('building sitemaps...');

    if (!queue.length) {
        working = 0;
        return log('empty queue. exiting...');
    }

    // Ensure we have a sitemap
    if (!indexFile) indexFile = defaultIndex;
    
    // Open
    indexFile = indexFile.split('</sitemapindex>')[0];
    
    // Edit
    queue.forEach(upsertSitemap);

    // Close
    indexFile += '</sitemapindex>';

    // Write
    fs.writeFileSync('./assets/sitemaps/index.xml', indexFile);

    // Create sitemaps
    queue.forEach(mkSitemap);

    function mkSitemap(catObj) {

        var file = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        file += '<url>' +
                    '<loc>https://' + config.domain + '/list/' + catObj.cat.bnid + '/' + alias(catObj.cat.title) + '</loc>' +
                    '<lastmod>' + new Date().toJSON() + '</lastmod>' +
                    '<changefreq>weekly</changefreq>' +
                '</url>';

        catObj.bnIDs.forEach(function (c) {

            if (!c || typeof c == "string") return;

            file += '<url>' +
                        '<loc>https://' + config.domain + '/item/' + c.bnid + '/' + alias(c.title) + '</loc>' +
                        '<lastmod>' + new Date().toJSON() + '</lastmod>' +
                        '<changefreq>weekly</changefreq>' +
                    '</url>';

        });

        file += '</urlset>';

        fs.writeFileSync('./assets/sitemaps/' + catObj.term.split('::').join('-') + '.xml', file);

    }
    
    log('sitemaps built in ' + (new Date().getTime() - d) + 'ms [added: ' + added + ', updated: ' + (queue.length - added) + ', total: ' + (indexFile.split('<sitemap>').length - 1) + ']');
    
    queue = [];
    working = 0;

    function upsertSitemap(catObj) {

        if (indexFile.match("/sitemaps/" + catObj.term.split('::').join('-') + '.xml')) {

            var tmpIndex = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
            var i = 0;

            indexFile.split("<sitemap>").forEach(function (s) {

                if (i++ == 0) return;

                if (s.match("/list/" + catObj.bnid)) {

                    s = s.split('</loc>')[0] + '</loc>' + '<lastmod>' + new Date().toJSON() + '</lastmod></sitemap>';

                }

                tmpIndex += '<sitemap>' + s;

            });

            indexFile = tmpIndex;

        } else {

            added++;

            indexFile += '<sitemap><loc>https://' + config.domain + '/sitemaps/'
                            + catObj.term.split('::').join('-') + '.xml' +
                            "</loc><lastmod>" + new Date().toJSON() + "</lastmod></sitemap>";

        }

    }

}