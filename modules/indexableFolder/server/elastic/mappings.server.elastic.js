/**
 * Created by Dimitri on 13/12/2017.
 */

exports.bodyAlbum = {
    // "settings": {
    //     "index.mapping.ignore_malformed": true,
    // },
    "mappings": {
        "album": {
            "properties": {
                "suggest" : {
                    "type" : "completion",
                    "contexts": [
                        {
                            "name": "genre",
                            "type": "category",
                            "path": "genre"
                        },
                        {
                            "name": "artist",
                            "type": "category",
                            "path": "artist"
                        }
                    ],
                },
                "name": {
                    "type": "text"
                },
                "keyName": {
                    "type": "keyword"
                },
                "artist": {
                    "type": "keyword"
                },
                "date": {
                    "type":   "date",
                    "format": "yyyy||yyyy-MM-dd",
                    "ignore_malformed": "true"
                },
                "disc": {
                    "type": "keyword"
                },
                "genre": {
                    "type": "keyword"
                },
            }
        },
    }
};

exports.bodyTracks = {
    // "settings": {
    //     "index.mapping.ignore_malformed": true,
    // },
    "mappings": {
        "tracks": {
            "properties": {
                "suggest" : {
                    "type" : "completion",
                    "contexts": [
                        {
                            "name": "genre",
                            "type": "category",
                            "path": "meta.genre"
                        },
                        {
                            "name": "artist",
                            "type": "category",
                            "path": "meta.artist"
                        },
                        {
                            "name": "album",
                            "type": "category",
                            "path": "meta.album"
                        },
                    ],
                },
                "tracksId": {
                    "type": "keyword",
                    "index": "false",
                },
                "path": {
                    "type": "keyword",
                },
                "name": {
                    "type": "keyword",
                    "index": "false",
                },
                "publicName": {
                    "type": "keyword",
                    "index": "false",
                },
                "meta": {
                    "title": {
                        "type": "text"
                    },
                    "album": {
                        "type": "keyword"
                    },
                    "artist": {
                        "type": "keyword"
                    },
                    "date": {
                        "type":   "date",
                        "format": "yyyy||yyyy-MM-dd",
                        "ignore_malformed": "true"
                    },
                    "disc": {
                        "type": "keyword"
                    },
                    "genre": {
                        "type": "keyword"
                    },
                }
            }
        },
    }
};

exports.bodyArtist = {
    // "settings": {
    //     "index.mapping.ignore_malformed": true,
    // },
    "mappings": {
        "artist": {
            "properties": {
                "suggest" : {
                    "type" : "completion"
                },
                "name": {
                    "type": "text"
                },
                "keyName": {
                    "type": "keyword"
                },
            }
        },
    }
};

exports.bodyGenre = {
    // "settings": {
    //     "index.mapping.ignore_malformed": true,
    // },
    "mappings": {
        "genre": {
            "properties": {
                "suggest" : {
                    "type" : "completion"
                },
                "name": {
                    "type": "text"
                },
                "keyName": {
                    "type": "keyword"
                },
            }
        },
    }
};