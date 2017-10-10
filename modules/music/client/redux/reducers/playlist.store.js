/**
 * Created by Dimitri Aguera on 08/09/2017.
 */
import { ACTIVATE_PLAYLIST, ADD_PLAYLIST_TO_PLAY, UPDATE_PLAYLIST_TO_PLAY,
PLAY_ITEM, PLAY_STATE, PAUSE_STATE, UPDATE_ACTIVE_PLAYLIST, UPDATE_PLAY_HISTORY } from '../actions'

let initialState = {
    onPlay: {
        name: null,
        src: null,
    },
    playingList: {
        pl: null,
        onPlayIndex: 0,
        currentTime: 0,
    },
    playingHistory: {
        tracks: [],
    },
    activePlaylist: null,
    pause: false,
};

export const playlistStore = (state = initialState, action) => {
    switch (action.type) {

        case PLAY_ITEM:
            return {
                ...state,
                onPlay: action.item
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

        case ADD_PLAYLIST_TO_PLAY:
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

        case UPDATE_PLAY_HISTORY:
            const tracks = state.playingHistory.tracks.concat([action.item]);
            return {
                ...state,
                playingHistory: {tracks: tracks},
            };

        default:
            return state
    }
};