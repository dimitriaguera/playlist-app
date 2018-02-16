/**
 * Created by Dimitri Aguera on 21/09/2017.
 */
import io from 'socket.io-client'
import { getLocalToken } from 'users/client/services/users.storage.services'

// @todo change how this url is generated
const url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/`;

const socketService = {

  getPrivateSocket: function (namespace, path) {
    const nsp = namespace || 'private';
    const options = {
      path: path || '',
      transportOptions: {
        polling: {
          extraHeaders: {
            'Authorization': getLocalToken()
          }
        }
      }
    };

    // Try to connect.
    const socket = io.connect(url + nsp, options);

    // Manage socket error or fail events.
    errorSocketEvents(socket);

    return socket;
  },

  getPublicSocket: function (namespace, path) {
    const nsp = namespace || 'public';
    const options = {
      path: path || ''
    };

    // Try to connect.
    const socket = io.connect(url + nsp, options);

    // Manage socket error or fail events.
    errorSocketEvents(socket);

    return socket;
  }
};


// HELPER.
function errorSocketEvents (socket) {
  // Catch error send by server.
  socket.on('error', function (err) {
    console.log('Server socket sent an error', err);
  });

  // Catch error on client side connexion request.
  socket.on('connect_error', function (err) {
    console.log('Connexion error', err);
    socket.close();
  });

  // Stop if reconnect failed.
  socket.on('reconnect_failed', () => {
    console.log('Reconnect failed');
    socket.close();
  });
}


export default socketService;
