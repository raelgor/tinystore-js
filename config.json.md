**Configuration file**

Create a `config.json` file based on this file. Keep in mind that many things are still hardcoded.

```js
{
    // Wether or not to start ZenX Platform
    // @todo Add ZenX Platform server info settings
    "cms": false,
    
    // Default 'from' used in emails
    "defaultEmailFrom": "Sender <no-reply@your-service.com>",
    
    // Default meta data
    "defaultKeywords": "very cool website",
    "defaultMetaDesc": "This is a cools website.",

    // Default domain name
    "domain": "your-service.com",
    
    // Default image cache location
    // @todo This is unused. Current default path is /cache
    "imageCache": "",
    
    // Email settings. Default and tested service is 'Gmail'
    "email": {
        "pass": "mypassphrase",
        "service": "Gmail",
        "user": "contact@your-service.com"
    },
    
    // Mongodb info.
    // @todo Support authentication
    "mongodb": {
        "ip": "127.0.0.1",
        "port": 27017,
        "database": "my_db_name"  
    },
    
    // Main service info
    "main": {
        "ip": "127.0.0.1",
        "httpPort": 80,
        "httpsPort": 443,
        "taskServerPort": 8965  
    },
    
    // Data source
    // @hint www.biblionet.gr is a nice site
    "dataSourceDomain": "dataman.tld",
    
    // Task server info
    "fetcher": {
        // @hint www.politeianet.gr is a nice site
        "targetDomain": "scrapee.tld",
        "ip": "127.0.0.1",
        "port": 8966
    },
    
    // Google recaptcha key
    "grecaptcha": {
        "key": "my-big-long-key-1234"
    },
    
    // Google browser key for Maps
    "googleBrowserKey": "my-big-long-browser-key",
    
    // Content info
    // @todo These should be in a database. Lol
    "orderInfoEmail": "order-log-email@gmail.com", // Address to send  orders to.
    "phone": "+30 696 9696 966",
    "phoneHours": "Δευτέρα - Σάββατο 9 π.μ. - 9 μ.μ.",
    "protocol": "https",
    "shippingCost": 4.9,
    "shippingMinimum": 28,
    "tax": 0.23
    
}
```

**SSL**

This project uses an outdated version of the ZenX project that does not support CA certificates.

After running `npm install` you need to dig in to `node_modules/zenx/zx/zx.Server.js` and add the `.ca` key to the configuration object.

By default, certificates wil be read from these locations:
- `./ssl/ssl.crt`
- `./ssl/ssl.ca`
- `./ssl/ssl.key`
