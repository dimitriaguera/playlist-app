/**
 * Created by Dimitri Aguera on 26/09/2017.
 */
const { ADMIN_ROLE, USER_ROLE, INVIT_ROLE } = require('../../commons/roles');
const socketStrategy = require('../config/socket.strategy');
const chalk = require('chalk');

module.exports = function ( socketsEvents, io ) {

    // Create namespace.
    const nsp = io.of('/private');

    // Protect this namespace.
    nsp.use( socketStrategy(ADMIN_ROLE) );

    // Apply messages.
    nsp.on( 'connection', messages );

    // Register events.
    socketsEvents.register( 'save:user', ( data ) => {
        console.log('post save fired');
        nsp.emit( 'save:user', data );
    });

};

function messages( socket ) {
    // Socket connexion messages.
    console.log(chalk.blue(`CONNECTED to socket ${socket.id}`));
    // Socket disconnexion message.
    socket.on('disconnect', function(){
        console.log(chalk.blue(`DISCONNECTED to socket ${socket.id}`));
    });
}
