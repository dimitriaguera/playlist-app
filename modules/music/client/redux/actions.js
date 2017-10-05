/**
 * Created by Dimitri Aguera on 02/10/2017.
 */
import { post } from 'core/client/services/core.api.services'

export const ADD_PLAYLIST = 'ADD_PLAYLIST';
export const ACTIVATE_PLAYLIST = 'ACTIVATE_PLAYLIST';
export const ADD_PLAYLIST_TO_PLAY = 'ADD_PLAYLIST_TO_PLAY';
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

export const playOnPlaylist = ( item ) => dispatch => {
    dispatch(addPlaylistToPlay(item));
    dispatch(playItem( item.pl.tracks[item.onPlayIndex] ));
};

export const addPlaylistToPlay = ( item ) => {
    return {
        type: ADD_PLAYLIST_TO_PLAY,
        item: item
    }
};

export const storePlayItem = ( item ) => {
   return {
       type: PLAY_ITEM,
       item: item
   }
};

export const playItem = ( item ) => dispatch => {
    dispatch(playState());
    dispatch(storePlayItem(item));
};

