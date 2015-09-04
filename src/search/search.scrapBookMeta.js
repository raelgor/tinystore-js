global.scrapBookMeta = function (bnid) {

    log('scrapBookMeta for ' + bnid + '...');

    return new Promise(function (resolve, rej) {

        var request = http.request({
            hostname: "biblionet.gr",
            method: "GET",
            path: "/book/" + bnid
        }, function (res) {

            res.setEncoding('utf8');

            var data = "";

            res.on("data", function (c) { data += c; });

            res.on("end", function () {

                var GOT_AUTHOR;

                var item = {
                    bnid: bnid,                        
                    categories: []
                };

                // Scrap title
                try {

                    var _ = data.split(/book_title">[ ]*<strong>/)[1];
                    item.title = _ && _.split('</strong>')[0];

                } catch (x) { };

                // Scrap image
                try {

                    var _ = data.split(/style="border: 1px solid #a9a9a9;"[ ]*src="/)[1];
                    item.img = _ && _.split('"')[0];

                } catch (x) { };

                // Scrap price
                try {

                    var _ = data.split(/ &euro; /)[1];

                    _ = _ && _.split('<')[0].split(',').join('.');

                    item.price = _ && parseFloat(_);

                } catch (x) { };

                // Scrap author
                try {

                    var _ = data.split(/a[ ]*class="booklink"[ ]*href="/)[1];
                    item.author = _ && _.split('">')[1].split('</a')[0];

                } catch (x) { };

                // Scrap authorid
                try {

                    var _ = data.split(/\/author\//)[1];
                    item.authorid = _ && _.split('/')[0];

                } catch (x) { };

                // Scrap description
                try {

                    var _ = data.split('<meta name="Description" content="')[1];
                    item.desc = _ && _.split('">')[0];

                } catch (x) { };

                // Scrap translator
                try {

                    var _ = data.split('μετάφραση: <a ')[1];
                    item.translator = _ && _.split('>')[1].split('</a')[0];

                } catch (x) { };

                // Scrap pages
                try {

                    item.pages = data.split(' σελ.<br>')[0].split('<br>').pop(); if (isNaN(item.pages)) delete item.pages;

                } catch (x) { };

                // Scrap isbn
                try {

                    var _ = data.split('ISBN ')[1];
                    item.isbn = _ && _.split(/[,\, ]/)[0];

                } catch (x) { };

                // Scrap isbn-13
                try {

                    var _ = data.split('ISBN-13')[1];
                    item.isbn13 = _ && _.split(/[,\, \[\<]/)[0].trim();

                } catch (x) { };

                // Scrap year
                try {

                    var _ = data.split(/class='book_details'>,[ ]*/)[1];
                    item.year = _ && _.split(/[<>br \,]/)[0];

                } catch (x) { };

                try {

                    var _ = data.split('/index/');
                    _.shift();
                    _.forEach(function (shard) {

                        var catBnid = shard.split('"')[0];

                        /[0-9]*/.test(catBnid) && item.categories.push(String(catBnid));

                    });

                } catch (x) { }

                item.title = item.title || "";

                item.alias = item.title && alias(item.title);

                item.scrapTS = new Date().getTime();

                if (item.authorid) scrapAuthorByBnid(item).then(function () { GOT_AUTHOR = 1; cb(); }); else { GOT_AUTHOR = 1; cb(); }
                
                function cb() {

                    GOT_AUTHOR && resolve(item);
                    GOT_AUTHOR && log('scrapBookMeta for ' + bnid + ' finished.');

                }

            });

        });

        request.on('error', function (err) {

            log('scrapBookMeta for ' + bnid + ' resolved with error: ' + err);
            resolve();

        });

        request.end();

    });

}