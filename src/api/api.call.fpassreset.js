module.exports = function (server) {

    return function (req, res, next) {

        var ip = req.connection.remoteAddress;

        var formData = req.body;

        log('fpassreset for user: ' + formData.token + ': verifying recaptcha...');

        // Verify captcha before anything else
        verifyCaptcha(req.body.cp_key, ip).then(resolve, reject);

        function reject() {

            log('fpassreset for user: ' + formData.token + ': rejecting...');
            res.send('{ "error": "1" }');

        }

        function resolve() {

            log('fpassreset for user: ' + formData.token + ': looking in mongo...');

            // Find (only the first) user by lastForgotPasswordToken
            server.db.collection('users').find({ lastForgotPasswordToken: String(req.body.token) }).toArray(function (err, data) {

                var user = data[0];

                // If found and can send email, send
                if (user && user.lastForgotPasswordToken) {

                    log('fpass for user: ' + formData.token + ': user found. resolving...');

                    // Find user in cache or create user object
                    user = server.userCache.users[user.bnid] || new User(user);

                    user.lastForgotPasswordToken = "";
                    user.lastVerificationEmailTS = 0;

                    user.resetPassword(formData.password);
                    user.updateRecord();

                    res.send('{ "success": 1 }');
                   
                // Otherwise reject
                } else reject();

            });

        };

    }

}