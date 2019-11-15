/**
 * Created by Dimitri on 27/11/2017.
 */

import SocketConnectors from '../../../../**/sockets/*.client.sockets.js';

/**
 * Let modules say if they need to dispatch action on store after some socket event emitted by server.
 * To register, you need to put logic inside your module at this location pattern :
 * [moduleName]/client/sockets/[name].client.sockets
 *
 * [name].client.sockets.js must return mountSocket function that apply listener on a socket event and
 * define handler that dispatch data on store.
 *
 * @param store
 */

const initSocketConnectors = function(store) {
  SocketConnectors.map(module => {
    module.mountSocket(store);
  });
};

export default initSocketConnectors;
