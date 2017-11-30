/**
 * Created by Dimitri on 27/11/2017.
 */

export const mustUpdate = (pl1, pl2) => {
    if( !pl1 || !pl2 ) {
        return false;
    }
    return (pl1.title === pl2.title);
};

export const getTrackIndexById = ( id, array ) => {
    let l = array.length;
    for( let i=0; i < l; i++ ) {
        if( array[i]._id == id ) return i;
    }
    return 0;
};

export const getPlayIndex = ( data, playingList ) => {

    const oldTracks = playingList.pl.tracks;
    const newTracks = data.tracks;

    let index = playingList.onPlayIndex;

    // If item playing moved, get his index.
    if( !newTracks[index] || oldTracks[index]._id !== newTracks[index]._id ) {
        index = getTrackIndexById( oldTracks[index]._id, newTracks );
    }

    return index;
};