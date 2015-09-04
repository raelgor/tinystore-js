module.exports = function (server) {

    fn.call(server);

}

function fn() {

    var server = this;
    var cache = server.userCache;

    this.Router.use([

            '/',
            '/search',
            '/item/*',
            '/list/**/*',
            '/categories',
            '/privacy-policy',
            '/terms-of-service',
            '/about',
            '/cart',
            '/api/*'

    ], function (req, res, next) {

        var user;

        // Bind user data to the response object to use later
        res._userData = {}

        // If found, add data to _userData and update cache
        function found() {

            res._userData.uuid = user.uuid;
            res._userData.email = user.email;
            res._userData.displayName = user.displayName;
            res._userData.verified = user.verified;

            res._userData.fbid = user.fbid;
            res._userData.csrf = user.tokens.filter(function (e) { return e.token == String(req.cookies.uauth) })[0].csrf;

            res._userData.wishlist = user.wishlist;
            res._userData.cart = user.cart;

            next();

        }

        // Raise first-time-flag if first time
        if (!req.cookies.stamp) {

            res._userData.cookieWarning = 1;
            res.cookie('stamp', '1', { maxAge: 60 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true });

        }

        // If no auth requested, we're done
        if (!req.cookies.uauth) return next();

        // If auth requested and it's cached, we're done
        if (req.cookies.uauth in cache.tokenIndex) {

            user = cache.tokenIndex[req.cookies.uauth].obj;
            
            // Renew cache object
            cache.tokenIndex[req.cookies.uauth].renew();

            return found();

        }

        // Otherwise
        server.db.collection('users').find({
            tokens: {
                $elemMatch: {
                    token: String(req.cookies.uauth),
                    expires: { $gt: new Date().getTime() }
                }
            }
        }).toArray(function (err, users) {

            user = users[0];

            // If found, return data
            if (user) {

                user = new User(user);
                
                if (!(user.uuid in server.userCache.users)) {

                    new CacheObject([
                        { object: server.userCache.users, key: user.uuid }
                    ], user, 1000 * 60 * 60 * 2);

                }

                server.userCache.users[user.uuid].addBound({
                    object: server.userCache.tokenIndex,
                    key: String(req.cookies.uauth)
                });

                found();

            } else {
                
                res._userData.clearLocalStorage = 1;
                res.clearCookie('uauth');
                next();

            }

        });

    });

}
