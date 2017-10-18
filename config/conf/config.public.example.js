/**
 * Created by Dimitri Aguera on 27/08/2017.
 */
'use strict';

module.exports = {

    app: {
        name: 'react-app-starter',
        title: 'Playlist',
        description: 'Une super description',
        keywords: 'de, super, mots, clés',
        logo: '/static/assets/img/logo.png',
        favicon: '/static/assets/img/ico.png',
    },

    port: process.env.PORT || '3000',
    host: process.env.HOST || 'localhost',
    protocol: process.env.PROTOCOL || 'http',
    domain: process.env.DOMAIN,

    api_base_url: '/api/',

    fileSystem: {
        fileAudioTypes: /\.(wav|mp3|flac)$/i,
        fileImageTypes: /\.(jpe?g|png|gif|bmp)$/i,
    },
};