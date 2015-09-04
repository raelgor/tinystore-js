module.exports = function (server) {

    fn.call(server);

}

function fn() {

    var server = this;

    this.Router.use(bodyParser.urlencoded({ extended: true }));
    
    this.Router.post('/api/login', function (req, res, next) {

        var ip = req.connection.remoteAddress;

        var formData = req.body;

        verifyCaptcha(req.body.cp_key, ip).then(resolve, reject);

        function reject() { res.send('{ "error": "1" }'); }

        function resolve() {

            // Find user in database
            server.db.collection('users').find({ email: String(formData.email) }).toArray(function (err, data) {

                var user = data[0];
                var valid_login = user && pwh.verify(String(formData.password), user.password);
                var uauth;

                // If valid, make new session
                if (valid_login) {

                    var newToken = new SessionToken();
                    var user = (server.userCache.users[data[0].uuid] && server.userCache.users[data[0].uuid].obj) || new User(data[0]);

                    uauth = newToken.token;

                    if (user.tokens.length >= 10) {

                        var deletedTokenObj = user.tokens.shift();

                        delete server.userCache.tokenIndex[deletedTokenObj.token];

                        server.db.collection('users').update({
                            uuid: user.uuid
                        }, {
                            $pop: { tokens: -1 }
                        });

                    }

                    user.tokens.push(newToken);

                    server.db.collection('users').update({ uuid: user.uuid }, {
                        $push: { tokens: newToken }
                    });

                    if (!(user.uuid in server.userCache.users)) {

                        new CacheObject([
                            { object: server.userCache.users, key: user.uuid }
                        ], user, 1000 * 60 * 60 * 2);

                    }

                    server.userCache.users[user.uuid].addBound({
                        object: server.userCache.tokenIndex,
                        key: newToken.token
                    });

                    res.cookie('uauth', uauth, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true });
                    res.send('{"success":"1"}');

                    // Otherwise fail
                } else res.send('{"error":"1"}');

            });

        };

    });

    this.Router.post('/api/register', function (req, res, next) {

        var ip = req.connection.remoteAddress;

        verifyCaptcha(req.body.cp_key, ip).then(resolve, reject);

        function reject() { res.send('{ "error": "1" }'); }

        function resolve() {

            var v = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

            if(!v.test(String(req.body.email))) return reject();

            server.db.collection('users').find({ email: String(req.body.email), verified: 1 }).toArray(function (err, data) {

                if (data.length) return res.send('{ "error": "2" }');

                var newToken = new SessionToken();
                var newUser = new User({

                    email: String(req.body.email),
                    password: pwh.generate(String(req.body.password), { algorithm: "sha256", saltLength: 15 }),
                    tokens: [newToken],
                    verified: 0

                });

                server.db.collection('users').insert(newUser);

                new CacheObject([
                    { object: server.userCache.users, key: newUser.uuid },
                    { object: server.userCache.tokenIndex, key: newToken.token }
                ], newUser, 1000 * 60 * 60 * 2);

                res.cookie('uauth', newToken.token, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true });
                res.send('{ "success": "1" }');

                // setup e-mail data with unicode symbols
                var mailOptions = {
                    from: 'Παζάρι Βιβλίου ✔ <no-reply@pazari-vivliou.gr>', // sender address
                    to: String(req.body.email), // list of receivers
                    subject: 'Καλώς ήλθατε στο Παζάρι Βιβλίου! Επιβεβαιώστε το email σας για να συνεχίσετε.', // Subject line
                    text: 'Hello world ✔', // plaintext body
                    html: '<b>Καλώς ήλθατε στο Παζάρι Βιβλίου! Κάντε κλικ εδώ για να επιβεβαιώσετε το email σας: </b><a>link</a>' // html body
                };

                // send mail with defined transport object
                mailTransporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Message sent: ' + info.response);
                    }
                });

            });

        }

    });

    this.Router.post('/api/logout', function (req, res, next) {

        // This is the posts's data
        var formData = req.body;
        var uauth = String(req.cookies.uauth);

        // If valid request
        if (res._userData.uuid) {

            if (res._userData.csrf == formData.csrf) {

                res.clearCookie('uauth');

                for (var index in server.userCache.users.tokens) {

                    if (server.userCache.users.tokens[index].token == uauth) {

                        server.userCache.users.tokens[index].splice(index, 1);

                    }

                }

                server.db.collection('users').update({ uuid: res._userData.uuid }, {
                    $pull: {
                        tokens: {
                            token: uauth
                        }
                    }
                });

                delete server.userCache.tokenIndex[uauth];

                res.send('');

            };

        } else res.send('');

    });

    this.Router.post('/api/fbauth', function (req, res, next) {

        // This is the posts's data
        var formData = req.body;
        var uauth;

        // On failure, return error obj
        function fail() { res.send('{"error":"1"}'); }

        // On success, set cookie and return thumbs up
        function success() {

            res.cookie('uauth', uauth, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true });
            res.send('{"success":"1"}');

        }

        // If no FB access token was sent, fail
        if (!formData.accessToken) fail(); else {

            // Verify access token and fetch user info
            FB.api('/me', { fields: ['id', 'name', 'email'], access_token: formData.accessToken }, function (response) {

                // If valid proceed, otherwise fail
                if (response.id) {

                    // Find user in database
                    server.db.collection('users').find({ fbid: response.id }).toArray(function (err, data) {

                        // Either way we need a new session token
                        var newToken = new SessionToken();

                        // If found, make a new session
                        if (data[0]) {

                            var user = (server.userCache.users[data[0].uuid] && server.userCache.users[data[0].uuid].obj) || new User(data[0]);

                            uauth = newToken.token;

                            if (user.tokens.length >= 10) {
                                
                                var deletedTokenObj = user.tokens.shift();

                                delete server.userCache.tokenIndex[deletedTokenObj.token];

                                server.db.collection('users').update({
                                    uuid: user.uuid
                                }, {
                                    $pop: { tokens: -1 }
                                });

                            }

                            user.tokens.push(newToken);

                            server.db.collection('users').update({ uuid: user.uuid }, {
                                $push: { tokens: newToken }
                            });

                            if (!(user.uuid in server.userCache.users)) {

                                new CacheObject([
                                    { object: server.userCache.users, key: user.uuid }
                                ], user, 1000 * 60 * 60 * 2);

                            }

                            server.userCache.users[user.uuid].addBound({
                                object: server.userCache.tokenIndex,
                                key: newToken.token
                            });

                            return success();

                        // Otherwise insert user
                        } else {

                            var newUser = new User({

                                fbid: response.id,
                                displayName: response.name,
                                email: response.email,
                                fbData: response,
                                tokens: [newToken],
                                verified: 1

                            });

                            server.db.collection('users').insert(newUser);

                            new CacheObject([
                                { object: server.userCache.users, key: newUser.uuid },
                                { object: server.userCache.tokenIndex, key: newToken.token }
                            ], newUser, 1000 * 60 * 60 * 2);

                        }

                        uauth = newToken.token;
                        success();

                    });

                } else fail();

            });

        }

    });

}

global.SessionToken = function(data) {

    data = data || {};

    this.expires = data.expires || new Date().getTime() + 1000 * 60 * 60 * 24 * 30;
    this.token = zx.uuid().split('-').join('');

    this.csrf = zx.uuid();

}

global.User = function(data) {

    data = data || {}

    for (var key in data) this[key] = data[key];

    this._id = this._id ? new ObjectID(String(this._id)) : new ObjectID();
    this.uuid = this.uuid || zx.uuid().split('-').join('');
    this.email = this.email || "";
    this.password = this.password || pwh.generate(zx.uuid(), { algorithm: "sha256", saltLength: 15 });

    this.lang = this.lang || "gr";
    this.lastEmailVerificationToken = this.lastEmailVerificationToken || "";

    this.verified = this.verified || 0;

    this.lastVerificationEmailTS = this.lastVerificationEmailTS || new Date().getTime();

}

global.CacheObject = function (bounds, obj, timeout) {

    var cacheObject = this;
    var TIMEOUT = timeout || 1000 * 60 * 60;

    this.obj = obj;
    this.used = 0;

    this.touch = function () {

        this.used++;
        this.renew();

    }

    this.renew = function () {

        clearTimeout(this.deletionInterval);
        this.deletionInterval = setTimeout(deleteSoon, TIMEOUT);

    }

    function deleteSoon() {

        bounds.forEach(function (bound) {

            delete bound.object[bound.key];

        });

    }

    bounds.forEach(function (bound) {

        bound.object[bound.key] = cacheObject;

    });

    this.addBound = function (bound){
    
        bounds.push(bound);
        bound.object[bound.key] = cacheObject;

    }

    this.renew();

}

function verifyCaptcha(rkey, ip) {

    return new Promise(function (resolve, reject) {

        var rdata = querystring.stringify({
            secret: RCP_KEY,
            response: rkey,
            remoteip: ip
        });

        var request = https.request({
            hostname: 'www.google.com',
            method: 'post',
            path: '/recaptcha/api/siteverify',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(rdata)
            }
        }, function (response) {

            var data = "";

            response.on('data', function (c) { data += c; });

            response.on('error', reject);

            response.on('end', function () {

                try {

                    JSON.parse(data).success && resolve();

                } catch (e) { reject(); };

            });

        });

        request.on('error', reject);

        request.write(rdata);

        request.end();

    });

}