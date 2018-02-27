/**
 * Created by Dimitri Aguera on 02/10/2017.
 */
import { post } from 'core/client/services/core.api.services'

export const ACTIVATE_PLAYLIST = 'ACTIVATE_PLAYLIST';
export const UPDATE_ACTIVE_PLAYLIST = 'UPDATE_ACTIVE_PLAYLIST';

export const PLAY_ITEM = 'PLAY_ITEM';
export const PLAY_STATE = 'PLAY_STATE';
export const PAUSE_STATE = 'PAUSE_STATE';

export const PLAY_TRACK_ON_ALBUM = 'PLAY_TRACK_ON_ALBUM';
export const PLAY_TRACK_ON_FOLDER = 'PLAY_TRACK_ON_FOLDER';
export const PLAY_TRACK_ON_PLAYLIST = 'PLAY_TRACK_ON_PLAYLIST';

export const PLAY_TRACK = 'PLAY_TRACK';

export const ADD_ALBUM_TO_PLAY = 'ADD_ALBUM_TO_PLAY';
export const ADD_FOLDER_TO_PLAY = 'ADD_FOLDER_TO_PLAY';
export const ADD_PLAYLIST_TO_PLAY = 'ADD_PLAYLIST_TO_PLAY';

export const UPDATE_ALBUM_TO_PLAY = 'UPDATE_ALBUM_TO_PLAY';
export const UPDATE_FOLDER_TO_PLAY = 'UPDATE_FOLDER_TO_PLAY';
export const UPDATE_PLAYLIST_TO_PLAY = 'UPDATE_PLAYLIST_TO_PLAY';

// export const UPDATE_PLAY_HISTORY = 'UPDATE_PLAY_HISTORY';

export const playState = () => {
  return {
    type: PLAY_STATE
  }
};

export const pauseState = () => {
  return {
    type: PAUSE_STATE
  }
};

export const playTrack = (item) => {
  return {
    type: PLAY_TRACK,
    item: item
  }
};

export const activatePlaylist = (item) => {
  return {
    type: ACTIVATE_PLAYLIST,
    item: item
  }
};

export const updateActivePlaylist = (item) => {
  return {
    type: UPDATE_ACTIVE_PLAYLIST,
    item: item
  }
};

export const playOnPlaylist = (item) => {
  return {
    type: PLAY_TRACK_ON_PLAYLIST,
    item: item
  }
};

export const playOnFolder = (item) => {
  return {
    type: PLAY_TRACK_ON_FOLDER,
    item: item
  }
};

export const playOnAlbum = (item) => {
  return {
    type: PLAY_TRACK_ON_ALBUM,
    item: item
  }
};

export const addAlbumToPlay = (item) => {
  return {
    type: ADD_ALBUM_TO_PLAY,
    item: item
  }
};

export const addFolderToPlay = (item) => {
  return {
    type: ADD_FOLDER_TO_PLAY,
    item: item
  }
};

export const addPlaylistToPlay = (item) => {
  return {
    type: ADD_PLAYLIST_TO_PLAY,
    item: item
  }
};

export const updateAlbumToPlay = (item) => {
  return {
    type: UPDATE_ALBUM_TO_PLAY,
    item: item
  }
};

export const updateFolderToPlay = (item) => {
  return {
    type: UPDATE_FOLDER_TO_PLAY,
    item: item
  }
};

export const updatePlaylistToPlay = (item) => {
  return {
    type: UPDATE_PLAYLIST_TO_PLAY,
    item: item
  }
};

export const playItem = (item) => {
  return {
    type: PLAY_ITEM,
    item: item
  }
};


// export const updatePlayHistory = ( item ) => {
//     return {
//         type: UPDATE_PLAY_HISTORY,
//         item: item
//     }
// };




