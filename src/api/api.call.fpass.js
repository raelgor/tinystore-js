module.exports = function (server) {

    return function (req, res, next) {

        var ip = req.connection.remoteAddress;

        var formData = req.body;

        log('fpass for user: ' + formData.email + ': verifying recaptcha...');

        // Verify captcha before anything else
        verifyCaptcha(req.body.cp_key, ip).then(resolve, reject);

        function reject() {

            log('fpass for user: ' + formData.email + ': rejecting...');
            res.send('{ "error": "1" }');

        }

        function resolve() {

            log('fpass for user: ' + formData.email + ': looking in mongo...');

            // Find (only the first) user by email
            server.db.collection('users').find({ email: String(req.body.email) }).toArray(function (err, data) {

                var user = data[0];

                // If found and can send email, send
                if (user) {

                    log('fpass for user: ' + formData.email + ': user found. resolving...');

                    // Find user in cache or create user object
                    user = server.userCache.users[user.bnid] || new User(user);

                    user.sendForgotPasswordEmail();
                    user.updateRecord();

                    res.send('{ "success": 1 }');
                   
                // Otherwise reject
                } else reject();

            });

        };

    }

}