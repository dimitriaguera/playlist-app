/**
 * Created by Dimitri on 13/12/2017.
 */

exports.album_body = {
  // "settings": {
  //     "index.mapping.ignore_malformed": true,
  // },
  mappings: {
    album: {
      properties: {
        suggest: {
          type: 'completion',
          contexts: [
            {
              name: 'genre',
              type: 'category',
              path: 'genre'
            },
            {
              name: 'artist',
              type: 'category',
              path: 'artist'
            }
          ]
        },
        name: {
          type: 'text'
        },
        keyName: {
          type: 'keyword'
        },
        key: {
          type: 'keyword'
        },
        artist: {
          type: 'keyword'
        },
        albumartist: {
          type: 'keyword'
        },
        year: {
          type: 'date',
          format: 'yyyy||yyyy-MM-dd',
          ignore_malformed: 'true'
        },
        diskno: {
          type: 'integer'
        },
        diskof: {
          type: 'integer'
        },
        label: {
          type: 'keyword'
        },
        genre: {
          type: 'keyword'
        }
      }
    }
  }
};

exports.tracks_body = {
  // "settings": {
  //     "index.mapping.ignore_malformed": true,
  // },
  mappings: {
    tracks: {
      properties: {
        suggest: {
          type: 'completion',
          contexts: [
            {
              name: 'genre',
              type: 'category',
              path: 'meta.genre'
            },
            {
              name: 'artist',
              type: 'category',
              path: 'meta.artist'
            },
            {
              name: 'album',
              type: 'category',
              path: 'meta.album'
            }
          ]
        },
        albumKey: {
          type: 'keyword'
        },
        tracksId: {
          type: 'keyword',
          index: 'false'
        },
        path: {
          type: 'keyword'
        },
        name: {
          type: 'keyword',
          index: 'false'
        },
        publicName: {
          type: 'keyword',
          index: 'false'
        },
        meta: {
          properties: {
            title: {
              type: 'text'
            },
            album: {
              type: 'keyword'
            },
            artist: {
              type: 'keyword'
            },
            albumartist: {
              type: 'keyword'
            },
            year: {
              type: 'date',
              format: 'yyyy||yyyy-MM-dd',
              ignore_malformed: 'true'
            },
            diskno: {
              type: 'integer'
            },
            diskof: {
              type: 'integer'
            },
            label: {
              type: 'keyword'
            },
            trackno: {
              type: 'integer'
            },
            trackof: {
              type: 'integer'
            },
            genre: {
              type: 'keyword'
            }
          }
        }
      }
    }
  }
};

exports.artist_body = {
  // "settings": {
  //     "index.mapping.ignore_malformed": true,
  // },
  mappings: {
    artist: {
      properties: {
        suggest: {
          type: 'completion'
        },
        name: {
          type: 'text'
        },
        keyName: {
          type: 'keyword'
        }
      }
    }
  }
};

exports.genre_body = {
  // "settings": {
  //     "index.mapping.ignore_malformed": true,
  // },
  mappings: {
    genre: {
      properties: {
        suggest: {
          type: 'completion'
        },
        name: {
          type: 'text'
        },
        keyName: {
          type: 'keyword'
        }
      }
    }
  }
};
