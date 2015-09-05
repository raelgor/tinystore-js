module.exports = function (server) {

    return function (req, res, next) {

        var ip = req.connection.remoteAddress;

        verifyCaptcha(req.body.cp_key, ip).then(resolve, reject);

        function reject() { res.send('{ "error": "1" }'); }

        function resolve() {

            var v = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

            if (!v.test(String(req.body.email))) return reject();

            server.db.collection('users').find({ email: String(req.body.email) }).toArray(function (err, data) {

                if (data.length) return res.send('{ "error": "2" }');

                var newToken = new SessionToken();
                var newUser = new User({

                    email: String(req.body.email),
                    password: pwh.generate(String(req.body.password), { algorithm: "sha256", saltLength: 15 }),
                    tokens: [newToken],
                    verified: 0

                });

                // Email accordingly and before we insert to
                // db so that we insert email info too
                newUser.sendVerificationEmail();

                server.db.collection('users').insert(newUser);

                new CacheObject([
                    { object: server.userCache.users, key: newUser.uuid },
                    { object: server.userCache.tokenIndex, key: newToken.token }
                ], newUser, 1000 * 60 * 60 * 2);

                res.cookie('uauth', newToken.token, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true });
                res.send('{ "success": "1" }');

            });

        }

    }

}