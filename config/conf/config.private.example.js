/**
 * Created by Dimitri Aguera on 27/08/2017.
 */
'use strict';

module.exports = {

    folder_base_url: 'D:/Musique',

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