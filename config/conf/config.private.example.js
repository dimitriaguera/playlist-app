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
    password: process.env.DB_PASSWORD || 'DB_PASSWORD'
  },

  security: {
    jwtSecret: 'SECRET',
    secureFile: /(^[^.].*)/,
    illegalUsernames: [
      'administrator', 'password', 'user',
      'unknown', 'anonymous', 'null', 'undefined', 'api'
    ]
  },

  session: {
    maxAgeToken: '1d'
  },

  logger: ':method :url :status :response-time ms - :res[content-length]',
  uploads: {},

  index: {
    sizeChunkNode: 20,
    sizeChunKCover: 20,
    sizeChunkElastic: 2000
  },

  // Uncomment lines with first letter Up for case sensitive system
  covers: {
    // Files pattern where to search existing cover files into folders.
    pattern: {
      // Searching if files match those names.
      files: [
        'cover.jpg', 'covers.jpg', 'front.jpg', 'frontal.jpg', 'folder.jpg', 'frontcover.jpg'
        // 'Cover.jpg', 'Covers.jpg', 'Front.jpg', 'Frontal.jpg', 'Folder.jpg', 'Frontcover.jpg',
      ],
      // Testing other format.
      no_jpg_files: [
        'cover.png', 'covers.png', 'front.png', 'frontal.png', 'folder.png',
        'cover.gif', 'covers.gif', 'front.gif', 'frontal.gif', 'folder.gif',
        'cover.bmp', 'covers.bmp', 'front.bmp', 'frontal.bmp', 'folder.bmp',
        'cover.jpeg', 'covers.jpeg', 'front.jpeg', 'frontal.jpeg', 'folder.jpeg'
        // 'Cover.png', 'Covers.png', 'Front.png', 'Frontal.png', 'Folder.png',
        // 'Cover.gif', 'Covers.gif', 'Front.gif', 'Frontal.gif', 'Folder.gif',
        // 'Cover.bmp', 'Covers.bmp', 'Front.bmp', 'Frontal.bmp', 'Folder.bmp',
        // 'Cover.jpeg', 'Covers.jpeg', 'Front.jpeg', 'Frontal.jpeg', 'Folder.jpeg',
      ],
      // Testing if sub-directory to run same tests above.
      folders: [
        'cover/', 'covers/', 'artwork/'
        // 'Cover/', 'Covers/', 'Artwork/',
      ]
    }
  },

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
  }
};
