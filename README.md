# Playlist-webapp

Web Application to create, manage, play your playlists.
Use Node.js, Express, MongoDB, React, Redux, Elastic

# Add API route

**YOU HAVE TO ADD IT IN THE /config/init-app.js in initRoutes function**

# Add socket route

## Server side
  
1)  In your working dir make a new dir name sockets. Inside it make a new file
named *.server.sockets.js. Take exemple from modules/music/server/sockets/music.server.sockets.js


2) Add your route in init-app.js in socketConnect function 

```
module.exports.socketConnect = function(app) {

    const serve = http.createServer(app);
    const io = socketServer(serve);

    require('../modules/users/server/sockets/users.server.sockets')( socketsEvents, io );
    require('../modules/music/server/sockets/music.server.sockets')( socketsEvents, io );
    
    ADD YOU ROUTE HERE
    require('MY_MODULE_PATH')( socketsEvents, io );
    
    return serve;
};
```

3) Now in your model file you can emit the event like this :

```
const socketsEvents = require('../../../../config/sockets/sockets.conf'); 

socketsEvents.emit( 'yourEvent', yourDATA );
```

## Client side

To receive event take exemple of : modules/music/client/sockets/music.client.sockets.js


