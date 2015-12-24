module.exports = function (server) {

    return function (req, res, next) {

        // This is the posts's data
        var formData = req.body;
        var uauth = String(req.cookies.uauth);

        // If valid request
        if (res._userData.uuid) {

            var lists = {};

            try {

                lists = JSON.parse(formData.lists);

            } catch (err) { }

            if (res._userData.csrf == formData.csrf) {

                var user = server.userCache.tokenIndex[uauth].obj;

                user.setLists(lists);
                user.updateRecord();

                res.send('');

            } else res.send('');

        } else res.send('');

    }

}