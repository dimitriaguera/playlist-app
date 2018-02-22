/**
 * Created by Dimitri Aguera on 27/08/2017.
 */
'use strict';

module.exports = {

  musicFolder: './data/music2', // Where your music is store
  picturesFolder: './data/pictures', // Where playlistapp going to store album cover

  port: process.env.PORT || '8080', // Port to run playlistapp
  host: process.env.HOST || 'localhost',
  protocol: process.env.PROTOCOL || 'http',
  domain: process.env.DOMAIN,

  db: { // Mongodb config
    client: 'mongodb',
    database: process.env.DB_NAME || 'playlistapp', // Database name
    host: process.env.DB_HOST || '127.0.0.1', // Mongo address
    port: process.env.DB_PORT || '27017', // Mongo port
    user: process.env.DB_USER || '', // Db user name
    password: process.env.DB_PASSWORD || '' // Db user password
  },

  es: { // ElasticSearch config
    hosts: [
      {
        protocol: 'http', // ElasticSearch protocol
        host: 'localhost', // ElasticSearch address
        port: 9200, // ElasticSearch port

        // Remove this comment if you use an user and pass for this host
        // auth: 'user:password', // ElasticSearch user and password

        // Remove this comment if you use an ssl certificate for this host
        // ssl: {
        //   ca: fs.readFileSync('./cacert.pem'),
        //   rejectUnauthorized: true
        // },

        // Milliseconds before an HTTP request will be aborted and retried. This can also be set per request.
        // Default is 30000 but on Raspberry you need to increase it
        requestTimeout: 60000,
      }
    ],
    log: [
      {
        type: 'stdio', // default
        level: 'error',
      }
    ]
  },

  security: {
    jwtSecret: 'SECRET', // You need to change (Add number, special char, mix upper case lower case)
    secureFile: /(^[^.].*)/,
    illegalUsernames: [
      'administrator', 'password', 'user',
      'unknown', 'anonymous', 'null', 'undefined', 'api'
    ]
  },

  session: {
    maxAgeToken: '1d' // Access Token Lifetime
  },

  logger: ':method :url :status :response-time ms - :res[content-length]',
  uploads: {},

  index: {
    sizeChunkNode: 20,
    sizeChunKCover: 20,
    sizeChunkElastic: 2000
  },

  // Uncomment lines with first letter in upper case for case sensitive system
  covers: {
    // Files pattern where to search existing cover files into folders.
    pattern: {
      // Searching if files match those names.
      files: [
        'cover.jpg', 'covers.jpg', 'front.jpg', 'frontal.jpg', 'folder.jpg', 'frontcover.jpg',
        'Cover.jpg', 'Covers.jpg', 'Front.jpg', 'Frontal.jpg', 'Folder.jpg', 'Frontcover.jpg',
      ],
      // Testing other format.
      no_jpg_files: [
        'cover.png', 'covers.png', 'front.png', 'frontal.png', 'folder.png',
        'cover.gif', 'covers.gif', 'front.gif', 'frontal.gif', 'folder.gif',
        'cover.bmp', 'covers.bmp', 'front.bmp', 'frontal.bmp', 'folder.bmp',
        'cover.jpeg', 'covers.jpeg', 'front.jpeg', 'frontal.jpeg', 'folder.jpeg',
        'Cover.png', 'Covers.png', 'Front.png', 'Frontal.png', 'Folder.png',
        'Cover.gif', 'Covers.gif', 'Front.gif', 'Frontal.gif', 'Folder.gif',
        'Cover.bmp', 'Covers.bmp', 'Front.bmp', 'Frontal.bmp', 'Folder.bmp',
        'Cover.jpeg', 'Covers.jpeg', 'Front.jpeg', 'Frontal.jpeg', 'Folder.jpeg',
      ],
      // Testing if sub-directory to run same tests above.
      folders: [
        'cover/', 'covers/', 'artwork/',
        'Cover/', 'Covers/', 'Artwork/',
      ]
    }
  },

  seedDB: {
    haveToSeed: true, // Create the admin user the first time you start playlistapp.
    collections: [{
      model: 'User',
      documents: [{
        username: 'admin', // Change administrator id
        password: 'adminpwd', // Change administrator password
        roles: ['ADMIN_ROLE', 'USER_ROLE']
      }]
    }]
  }
};
