/**
 * Created by Dimitri Aguera on 27/08/2017.
 */
'use strict';

module.exports = {

    app: {
        name: 'Webapp playlist',
        title: 'Webapp Playlist',
        description: 'Make your oun playlist',
        keywords: 'music, playlist, react, node',
        logo: '/static/assets/img/logo.png',
        favicon: '/static/assets/img/ico.png',
    },

    port: process.env.PORT || '8082',
    host: process.env.HOST || '91.69.107.250',
    domain: process.env.DOMAIN,
    protocol: process.env.PROTOCOL || 'http',

    api_base_url: '/api/',
    folder_base_url: '/var/DIMI_BACKUPS/desktop1/Musique',

    fileSystem: {
        fileAudioTypes: /\.(wav|mp3|flac)$/i,
        fileImageTypes: /\.(jpe?g|png|gif|bmp)$/i,
    },

    db: {
        client: 'mongodb',
        database: process.env.DB_NAME || 'playlist-webapp',
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || '27017',
        user: process.env.DB_USER || 'DB_USER_NAME',
        password: process.env.DB_PASSWORD || 'DB_PASSWORD',
    },

    security: {
        jwtSecret: 'SECRET',
        illegalUsernames: [
            'administrator', 'password', 'user',
            'unknown', 'anonymous', 'null', 'undefined', 'api'
        ]
    },

    session: {
        maxAgeToken: '1d',
    },

    logger: ':method :url :status :response-time ms - :res[content-length]',
    uploads: {},

    seedDB: {
        haveToSeed: false,
        collections: [{
            model: 'User',
            documents: [{
                username: 'admin',
                password: 'adminpwd',
                roles: ['ADMIN_ROLE', 'USER_ROLE']
            }]
        }]
    },
};
