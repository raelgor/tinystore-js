/* global fs */
/* global config */
/* global socks */
'use strict';

var buffer = [];

global.tor = config.tor.useTor && (function(options, secretary) {
    
    if(!secretary || !options)
        return options && buffer.push(options);
    
    let queue = options.imgReqIndex[options.cacheFilepath].res
    
    delete options.imgReqIndex[options.cacheFilepath];
    
    let out = { write: buffer => { for(let response of queue) response.write(buffer); } }
    
    let reqOpts = {
        proxy: {
            ipaddress: config.tor.ipaddress,
            port: config.tor.port,
            type: 4
        },
        target: {
            host: config.dataSourceDomain,
            port: 80
        },
        command: 'connect'
    };
 
    socks.createConnection(reqOpts, function(err, socket, info) {

        if(err || !socket) {
            
            for(let response of queue)
                response.redirect('https://' + config.domain + '/noimg.jpg');
                
            return;
            
        }
        
        socket.write("GET " + options.filepath + " HTTP/1.1\nHost: " + config.dataSourceDomain + "\n\n");
        
        var first = true;
        var found = false;
    
        socket.write("GET " + options.filepath + " HTTP/1.1\nHost: " + config.dataSourceDomain + "\n\n");
        
        socket.on('data', c => {
            
            if(first) {
                
                first = false;
                
                let tmp = c.toString('utf8');
                
                if(!~tmp.indexOf('200 OK') || !~tmp.indexOf('image/'))
                    for(let response of queue)
                        response.redirect('https://' + config.domain + '/noimg.jpg');
                else {
                
                    socket.pause();
                    fs.stat(options.cacheFilepath, (err, stat) => {
                
                        if(err)        
                            queue.push(fs.createWriteStream(options.cacheFilepath));
                        
                        socket.resume();
                        
                    });
                
                }
                
            }
            
            if(found)
                return out.write(c);
            
            let asStr = c.toString('utf8').split('\r\n\r\n');
            
            if(asStr.length > 1) {
                
                found = true;
                out.write(c.slice(c.indexOf('\r\n\r\n') + 4, Infinity));            
                
            }
            
        });
        
        setTimeout(() => {
            
            for(let response of queue) response.end();
            socket.end();
            
        }, 6e4);
        
        socket.resume();
            
    });
    
});

setInterval(() => global.tor(buffer.shift(), true), 3000);