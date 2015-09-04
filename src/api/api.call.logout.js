module.exports = function (server) {

    return function (req, res, next) {

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

    }

}