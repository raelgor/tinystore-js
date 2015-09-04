module.exports = function (server) {

    return function (req, res, next) {

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

    }

}