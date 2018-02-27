/**
 * Created by Marc Foletto on 23/02/2018.
 */
'use strict';

// For a list of role see modules/users/commons/roles.js
// Exemple role : [ADMIN_ROLE, USER_ROLE, INVIT_ROLE, DEFAULT_AUTH_ROLE, ALL_ROLE]
// for route with no authentication affect it to false
const path = require('path');

const roles = require(path.resolve('./modules/users/commons/roles'));


module.exports = {

  // folder.server.routes
  '/api/folder': [roles.ADMIN_ROLE, roles.USER_ROLE],
  '/api/files': [roles.ADMIN_ROLE, roles.USER_ROLE],

  // IndexableFolder.server.routes.js
  '/api/files/cover/all': [roles.ADMIN_ROLE],
  '/api/nodes/:id/meta': [roles.ADMIN_ROLE, roles.USER_ROLE],
  '/api/nodes/:id': [roles.ADMIN_ROLE, roles.USER_ROLE],
  '/api/nodes/build': [roles.ADMIN_ROLE],
  '/api/nodes/:query/child': [roles.ADMIN_ROLE, roles.USER_ROLE],
  '/api/nodes/:query/files': [roles.ADMIN_ROLE, roles.USER_ROLE],
  '/api/elastic/build': [roles.ADMIN_ROLE],
  '/api/elastic/test': [roles.ADMIN_ROLE],
  '/api/album/:key': [roles.ADMIN_ROLE, roles.USER_ROLE],
  '/api/album/tracks/:key': [roles.ADMIN_ROLE, roles.USER_ROLE],
  '/api/search/:type': [roles.ADMIN_ROLE, roles.USER_ROLE],
  '/api/suggest/:type': [roles.ADMIN_ROLE, roles.USER_ROLE],

  // users.server.routes.js
  '/api/login': false,
  '/api/register': [roles.ALL_ROLE],
  '/api/account': [roles.ADMIN_ROLE, roles.USER_ROLE],
  '/api/users': [roles.ADMIN_ROLE, roles.USER_ROLE],
  '/api/users/:userName': [roles.ADMIN_ROLE, roles.USER_ROLE],

  // uploadZone.server.routes.js
  '/api/sendFiles': [roles.ADMIN_ROLE],

  // task.server.routes.js
  '/api/task': [roles.ADMIN_ROLE],
  '/api/task/id/:memId': [roles.ADMIN_ROLE],
  '/api/task/key/:key': [roles.ADMIN_ROLE],

  // music.server.routes.js
  '/api/music/read': [roles.ADMIN_ROLE, roles.USER_ROLE],
  '/api/ownedPlaylist': [roles.ADMIN_ROLE, roles.USER_ROLE],
  '/api/playlist': [roles.ADMIN_ROLE, roles.USER_ROLE],
  '/api/playlist/:title': [roles.ADMIN_ROLE, roles.USER_ROLE]
};
