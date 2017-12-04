/**
 * Created by Dimitri Aguera on 27/08/2017.
 */
'use strict';

module.exports = {

    folder_base_url: 'D:/Musique',
    public_base_url: 'pictures',

    port: process.env.PORT || '3000',
    host: process.env.HOST || 'localhost',
    protocol: process.env.PROTOCOL || 'http',
    domain: process.env.DOMAIN,

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
        secureFile: /(^[^.].*)/,
        illegalUsernames: [
            'administrator', 'password', 'user',
            'unknown', 'anonymous', 'null', 'undefined', 'api'
        ],
    },

    session: {
        maxAgeToken: '1d',
    },

    logger: ':method :url :status :response-time ms - :res[content-length]',
    uploads: {},

    ffmpegExec: './modules/music/server/services/metaTag/ffmpeg/YOUR_OS/ffmpeg',

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
