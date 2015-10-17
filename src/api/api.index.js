module.exports = function (server) {

    fn.call(server);

}

function fn() {

    var server = this;

    // Adds new bouncing rule
    bounce({
        // The rule applies if the $match
        // pattern matches
        $match: {
            request: "login"
        },
        // These values of the request
        // will be added to its identifier
        $include: {
            username: 1
        }
    })
    // Blacklist these requests when we've had 100
    // of them in 10 seconds for 10 seconds
    .on(100).over(10000).for(10000);

    // Middleware to parse form data
    this.Router.use(bodyParser.urlencoded({ extended: true }));

    // Load api call handlers
    this.Router.post('/api/login', require('./api.call.login.js')(server));
    this.Router.post('/api/register', require('./api.call.register.js')(server));
    this.Router.post('/api/logout', require('./api.call.logout.js')(server));
    this.Router.post('/api/fbauth', require('./api.call.fbauth.js')(server));
    this.Router.post('/api/fpass', require('./api.call.fpass.js')(server));
    this.Router.post('/api/fpassreset', require('./api.call.fpassreset.js')(server));
    this.Router.post('/api/updatelists', require('./api.call.updatelists.js')(server));
    this.Router.post('/api/order', require('./api.call.order.js')(server));

    // Unauthorized get calls
    this.Router.get('/api/verify', require('./api.call.verify.js')(server));

}