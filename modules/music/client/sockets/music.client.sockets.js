/**
 * Created by Dimitri on 27/11/2017.
 */
import socketServices from 'core/client/services/core.socket.services'
import { updateActivePlaylist, updatePlaylistToPlay } from 'music/client/redux/actions'
import { mustUpdate, getPlayIndex } from 'music/client/helpers/music.client.helpers'

/**
 * Connect events emitted by server on socketIO with redux app store.
 * When server emit event on socket, a dispatch is called to update store state...
 * IMPORTANT: redux store is updated on socket event regardless components are mount or not.
 *
 */

/**
 * function called with mounted store on boot app.
 * @param store
 * @returns {*}
 */
export const mountSocket = function(store) {

    // Create a socket.
    const socket = socketServices.getPublicSocket();

    // Apply event.
    socket.on('save:playlist', (data) => {
        checkAndUpdatePlaylistHandler(store, data);
    });

    return socket;
};

/**
 * Function called on socket server emit 'save:playlist' event.
 * Update playing playlist if exist and match with playlist send via socket.
 * Update activated playlist if exist and match with playlist send via socket.
 *
 * @param store
 * @param updatedPl
 */
function checkAndUpdatePlaylistHandler(store, updatedPl) {

    let state = store.getState();
    let plState = state.playlistStore;

    // On playlist mode, check if need to update playling list.
    if( plState.mode === 'playlist' ){

        let toUpdate =  plState.playingList;

        // If playlist updated is currently playing on app.
        if( mustUpdate(updatedPl, toUpdate.pl) ){

            // If server emit updated playlist with no tracks, do something.
            // @TODO COMPORTEMENT A CHANGER
            if( updatedPl.tracks.length === 0 ){
                alert('Diantre, la playlist en cours de lecture est vide....');
            }
            // Dispatch updated playlist and playIndex.
            else {
                store.dispatch(
                    updatePlaylistToPlay({
                        pl: updatedPl,
                        onPlayIndex: getPlayIndex(updatedPl, toUpdate)
                    })
                );
            }
        }
    }

    // If a playlist is activated, check if need to update.
    if( plState.activePlaylist !== null ){

        let plToUpdate =  plState.activePlaylist;

        // Dispatch updated activePlaylist.
        if( mustUpdate(updatedPl, plToUpdate) ){
            store.dispatch(
                updateActivePlaylist(updatedPl)
            );
        }
    }
}
