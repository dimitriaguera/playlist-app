/**
 * Created by Dimitri Aguera on 08/09/2017.
 */
import {
    ACTIVATE_PLAYLIST, UPDATE_ACTIVE_PLAYLIST,
    PLAY_TRACK_ON_PLAYLIST, PLAY_TRACK_ON_ALBUM, PLAY_TRACK_ON_FOLDER,
    ADD_ALBUM_TO_PLAY, ADD_PLAYLIST_TO_PLAY, ADD_FOLDER_TO_PLAY,
    UPDATE_PLAYLIST_TO_PLAY, UPDATE_ALBUM_TO_PLAY, UPDATE_FOLDER_TO_PLAY,
    PLAY_ITEM, PLAY_STATE, PAUSE_STATE
} from '../actions'

let initialState = {
    onPlay: {
        name: null,
        path: null,
        meta: [],
    },
    playingList: {
        pl: null,
        onPlayIndex: 0,
        currentTime: 0,
    },
    playingHistory: {
        tracks: [],
    },
    mode: null,
    activePlaylist: null,
    pause: false,
};

export const playlistStore = (state = initialState, action) => {
    switch (action.type) {

        case PLAY_ITEM:
            return {
                ...state,
                onPlay: action.item,
                pause: false,
            };

        case PAUSE_STATE:
            return {
                ...state,
                pause: true,
            };

        case PLAY_STATE:
            return {
                ...state,
                pause: false,
            };

        case ADD_ALBUM_TO_PLAY:
            return {
                ...state,
                mode: 'album',
                playingList: Object.assign({onPlayIndex: 0, currentTime: 0}, action.item),
            };

        case ADD_FOLDER_TO_PLAY:
            return {
                ...state,
                mode: 'folder',
                playingList: Object.assign({onPlayIndex: 0, currentTime: 0}, action.item),
            };

        case ADD_PLAYLIST_TO_PLAY:
            return {
                ...state,
                mode: 'playlist',
                playingList: Object.assign({onPlayIndex: 0, currentTime: 0}, action.item),
            };

        case PLAY_TRACK_ON_ALBUM:
            return {
                ...state,
                mode: 'album',
                playingList: Object.assign({}, state.playingList, action.item),
                pause: false,
                onPlay: action.item.pl.tracks[action.item.onPlayIndex]
            };

        case PLAY_TRACK_ON_FOLDER:
            return {
                ...state,
                mode: 'folder',
                playingList: Object.assign({}, state.playingList, action.item),
                pause: false,
                onPlay: action.item.pl.tracks[action.item.onPlayIndex]
            };

        case PLAY_TRACK_ON_PLAYLIST:
            return {
                ...state,
                mode: 'playlist',
                playingList: Object.assign({}, state.playingList, action.item),
                pause: false,
                onPlay: action.item.pl.tracks[action.item.onPlayIndex]
            };

        case UPDATE_ALBUM_TO_PLAY:
            return {
                ...state,
                playingList: Object.assign({}, state.playingList, action.item),
            };

        case UPDATE_FOLDER_TO_PLAY:
            return {
                ...state,
                playingList: Object.assign({}, state.playingList, action.item),
            };

        case UPDATE_PLAYLIST_TO_PLAY:
            return {
                ...state,
                playingList: Object.assign({}, state.playingList, action.item),
            };

        case ACTIVATE_PLAYLIST:
            return {
                ...state,
                activePlaylist: action.item
            };

        case UPDATE_ACTIVE_PLAYLIST:
            return {
                ...state,
                activePlaylist: action.item
            };

        // case UPDATE_PLAY_HISTORY:
        //     const tracks = state.playingHistory.tracks.concat([action.item]);
        //     return {
        //         ...state,
        //         playingHistory: {tracks: tracks},
        //     };

        default:
            return state
    }
};