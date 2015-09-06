module.exports = function (server) {

    return function (req, res, next) {

        var ip = req.connection.remoteAddress;

        var formData = req.body;

        verifyCaptcha(req.body.cp_key, ip).then(resolve, reject);

        function reject() { res.send('{ "error": "1" }'); }

        function resolve() {

            var passed = bounce.check({ request: "login", username: "kosmas" });

            if (!passed) return reject();

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

    }

}