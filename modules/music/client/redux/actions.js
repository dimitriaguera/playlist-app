/**
 * Created by Dimitri Aguera on 02/10/2017.
 */
import { post } from 'core/client/services/core.api.services'

export const ACTIVATE_PLAYLIST = 'ACTIVATE_PLAYLIST';
export const UPDATE_ACTIVE_PLAYLIST = 'UPDATE_ACTIVE_PLAYLIST';
export const ADD_ALBUM_TO_PLAY = 'ADD_ALBUM_TO_PLAY';
export const ADD_PLAYLIST_TO_PLAY = 'ADD_PLAYLIST_TO_PLAY';
export const UPDATE_PLAYLIST_TO_PLAY = 'UPDATE_PLAYLIST_TO_PLAY';
export const UPDATE_PLAY_HISTORY = 'UPDATE_PLAY_HISTORY';
export const PLAY_ITEM = 'PLAY_ITEM';
export const PLAY_STATE = 'PLAY_STATE';
export const PAUSE_STATE = 'PAUSE_STATE';

export const playState = () => {
    return {
        type: PLAY_STATE,
    }
};

export const pauseState = () => {
    return {
        type: PAUSE_STATE,
    }
};

export const activatePlaylist = ( item ) => {
    return {
        type: ACTIVATE_PLAYLIST,
        item: item
    }
};

export const updateActivePlaylist = ( item ) => {
    return {
        type: UPDATE_ACTIVE_PLAYLIST,
        item: item
    }
};

export const playOnPlaylist = ( item ) => dispatch => {
    dispatch(addPlaylistToPlay(item));
    dispatch(playItem( item.pl.tracks[item.onPlayIndex] ));
};

export const playOnAlbum = ( item ) => dispatch => {
    dispatch(addAlbumToPlay(item));
    dispatch(playItem( item.pl.tracks[item.onPlayIndex] ));
};

export const addAlbumToPlay = ( item ) => {
    return {
        type: ADD_ALBUM_TO_PLAY,
        item: item
    }
};

export const addPlaylistToPlay = ( item ) => {
    return {
        type: ADD_PLAYLIST_TO_PLAY,
        item: item
    }
};

export const updatePlaylistToPlay = ( item ) => {
    return {
        type: UPDATE_PLAYLIST_TO_PLAY,
        item: item
    }
};

export const updatePlayHistory = ( item ) => {
    return {
        type: UPDATE_PLAY_HISTORY,
        item: item
    }
};

export const storePlayItem = ( item ) => {
   return {
       type: PLAY_ITEM,
       item: item
   }
};

export const playItem = ( item, noHistory = false ) => dispatch => {
    dispatch(playState());
    dispatch(storePlayItem(item));
    if ( !noHistory ) {
        dispatch(updatePlayHistory(item));
    }
};

