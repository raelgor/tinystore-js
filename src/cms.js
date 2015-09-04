var zenx = require('zenx');
var config = global.config;
var path = require('path');

global.cmsServer = new zx.ZenXManagerServer({

    "db_type": "mongodb",
    "db_host": "mongodb://" + global.nw + ":27017/zenx",
    "db_user": "",
    "db_pass": "",
    "bind": global.nw,
    "port": "10000",
    "https": true,
    "ws": true,
    "isBehindProxy": false,
    "ssl_key": path.resolve(__dirname + "/../ssl/ssl.key"),
    "ca": path.resolve(__dirname + "/../ssl/ssl.ca"),
    "ssl_crt": path.resolve(__dirname + "/../ssl/ssl.crt")

});