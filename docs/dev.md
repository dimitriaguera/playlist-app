# Developers section

To build the app and watch files :
```
npm run watch
```

To start the server :
```
npm run start
```

To start eslint :
```
npm run lint
```

To fix eslint :
```
npm run lintfix
```


## Add API route

Let's call your module directory YOURMODULEDIR.
You need two js files :
* controller in : modules/YOURMODULEDIR/server/controllers/WHATDOYOUWHANT.server.controllers.js
* route in : modules/YOURMODULEDIR/server/routes/WHATDOYOUWHANT.server.routes.js


WHATDOYOUWHANT.server.routes.js
```
'use strict';

const path = require('path');
const passport = require('passport');
const authorizeRoles = require(path.resolve('./modules/users/server/roles/route.role.authorize'));
const { USER_ROLE } = require(path.resolve('./modules/users/commons/roles'));

// The controllers of your routes
const YOURCONTROLLER = require(path.resolve('./modules/YOURMODULEDIR/server/controllers/WHATDOYOUWHANT.server.controllers.js');

module.exports = function (app) {

  // Your first root unprotected
  app
    .route('/api/YOURFIRTROUTE')
    .get(YOURCONTROLLER.fct1);

  // Your second root protected
  app
    .route('/api/YOURSECONDROUTE')
    .all(passport.authenticate('jwt', { session: false }), authorizeRoles(USER_ROLE))
    .get(YOURCONTROLLER.fct2);
};
```

WHATDOYOUWHANT.server.controllers.js
```
exports.fct1 = function (req, res, next) {

}

exports.fct2 = function (req, res, next) {

}
```

**Add your new route file in /config/init-app.js in initRoutes function**

## Add socket

### Server side

Let's call your module directory YOURMODULEDIR.
Add a js files in modules/YOURMODULEDIR/server/routes/WHATDOYOUWHANT.server.sockets.js

WHATDOYOUWHANT.server.sockets.js
```
'use strict';

const path = require('path');
const { ADMIN_ROLE, USER_ROLE, INVIT_ROLE } = require(path.resolve('./modules/users/commons/roles'));
const socketStrategy = require(path.resolve('./modules/users/server/config/socket.strategy'));

module.exports = function (socketsEvents, io) {

  // Create namespace unprotected
  const nsp = io.of('/public');
  
  // Register events.
  socketsEvents.register('MYEVENT:MYSUBEVENT', (data) => {
    nsp.emit('MYEVENT:MYSUBEVENT', data);
  });
  
  // Create namespace unprotected
  const nsp = io.of('/private');
    
  // Protect this namespace.
  nsp.use( socketStrategy(ADMIN_ROLE) );
  
  // Register events.
  socketsEvents.register('MYEVENTPROTECTED:MYSUBEVENTPROTECTED', (data) => {
    nsp.emit('MYEVENTPROTECTED:MYSUBEVENTPROTECTED', data);
  });
  
}
```


**Add your WHATDOYOUWHANT.server.sockets.js in init-app.js in socketConnect function**

```
module.exports.socketConnect = function(app) {

    const serve = http.createServer(app);
    const io = socketServer(serve);

    require('../modules/users/server/sockets/users.server.sockets')( socketsEvents, io );
    require('../modules/music/server/sockets/music.server.sockets')( socketsEvents, io );
    
    // ADD YOU ROUTE HERE
    require('../modules/YOURMODULEDIR/server/routes/WHATDOYOUWHANT.server.routes.js')( socketsEvents, io );
    
    return serve;
};
```

Add a js files in your controller file (for example : modules/YOURMODULEDIR/server/controllers/WHATDOYOUWHANT.server.controllers.js)
emit the event where you want.

WHATDOYOUWHANT.server.controllers.js
```
const path = require('path');
const socketsEvents = require(path.resolve('./config/sockets/sockets.conf'));


// Put this where do you want emit the event
socketsEvents.emit( 'MYEVENT:MYSUBEVENT', YOURDATA );

```

### Client side

Add a js files in modules/YOURMODULEDIR/client/components/WHATDOYOUWHANT.client.components.jsx


WHATDOYOUWHANT.client.components.jsx
```
import React, { Component } from 'react'
import socketServices from 'core/client/services/core.socket.services'

export class Mycomponent extends Component {
  constructor () {
    super();
    this.socket = socketServices.getPublicSocket();
    this.state.socketsDatas = null;
  }

  componentWillMount () {
    const _self = this;
    
    // Add the data received by socket in the state
    this.socket.on('save:playlist', (data) => {
      _self.setState({ socketsDatas: data })
    });
  }
  
  render () {
    return (
      <div>{this.state.socketsDatas}</div>
    )
  }
}
```

Voilà !