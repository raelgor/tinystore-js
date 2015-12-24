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
                var orderId = zx.uuid().split('-')[0].toUpperCase();

                if (!user.verified) return res.send('{}');

                getBooksByBnids(Object.keys(lists.cart)).then(function (data) {

                    var cart = [];
                    var cprice = 0;

                    data.forEach(e => {
                        if (e && price(e) && !e.unavail) {
                            e.qtt = lists.cart[e.bnid] && lists.cart[e.bnid].quantity;
                            cart.push(e);
                            cprice += +price(e) * (+e.qtt || 1);
                        }
                    });

                    var order = {
                        cart: cart,
                        form: formData,
                        orderId: orderId,
                        ts: new Date().getTime(),
                        price: cprice,
                        shipping: cprice > config.shippingMinimum ? 0 : config.shippingCost,
                        user: user
                    };

                    server.db.collection('orders').insert(order);

                    res.send(JSON.stringify({

                        success: 1,
                        orderId: orderId

                    }));

                    email.sendOrderInfoEmail(config.orderInfoEmail, order);
                    user.email && email.sendOrderInfoEmailToClient(user.email, order);

                });

            } else res.send('{}');

        } else res.send('{}');

    }

}