module.exports = function (server) {

    return function (req, res, next) {

        var get = req.query;

        if (get.token) {

            log('verify: ' + get.token + ': looking in mongo...');

            server.db.collection('users').find({

                "verified": 0,
                "lastVerificationEmailTS": {

                    // Is not resolved
                    $ne: 0

                },
                "lastEmailVerificationToken": String(get.token)

            }).toArray(function (err, data) {

                if (data[0]) {

                    log('verify: ' + get.token + ': found in mongo.');

                    var user = data[0];

                    server.db.collection('users').update({ uuid: user.uuid }, {
                        $set: {

                            verified: 1,
                            lastEmailVerificationToken: "",
                            lastVerificationEmailTS: 0

                        }
                    });

                    if (user.uuid in server.userCache.users) {

                        server.userCache.users[user.uuid].obj.verified = 1;
                        server.userCache.users[user.uuid].obj.lastEmailVerificationToken = "";
                        server.userCache.users[user.uuid].obj.lastVerificationEmailTS = 0;

                    }

                }

                log('verify: ' + get.token + ': resolving...');
                res.redirect('https://' + config.domain);

            });

        } else {

            log('verify api called without token. redirecting...');
            res.redirect('https://' + config.domain);

        }

    }

}