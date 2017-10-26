import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get, put } from 'core/client/services/core.api.services'
import { addAlbumToPlay } from 'music/client/redux/actions'
import PlaylistItem from 'music/client/components/playlistItem.client.components'
import { Divider } from 'semantic-ui-react'

import DraggableList from 'draggable/client/components/draggableList'

class Album extends Component {


    constructor( props ) {

        super( props );

        this.handlerReadFile = this.handlerReadFile.bind(this);
        this.handlerMoveItem = this.handlerMoveItem.bind(this);
    }

    handlerReadFile( key ) {

        const { albumList } = this.props;

        return (e) => {

            this.props.readFile({
                al: albumList.al,
                onPlayIndex: key,
            });
            e.preventDefault();
        }
    }

    handlerMoveItem( items ) {

        // Saving updated playlist.
        //return saveAlbum( items );
    }

    render(){

        const { albumList, isPaused, isAuthenticated, user } = this.props;

        if( !albumList ) return null;

        const { onPlayIndex, al } = albumList;

        return (
            <div>
                <h1>{al.title}</h1>
                <Divider/>
                <DraggableList
                    items={al.tracks}
                    callbackMouseUp={this.handlerMoveItem}
                    component={PlaylistItem}
                    isActivePlaylist={true}
                    user={user}
                    isPaused={isPaused}
                    onPlayIndex={onPlayIndex}
                    onPlay={this.handlerReadFile}
                />
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        albumList: state.playlistStore.albumList,
        isPaused: state.playlistStore.pause,
        onPlay: state.playlistStore.onPlay,
        isAuthenticated: state.authenticationStore.isAuthenticated,
        user: state.authenticationStore._user,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        readFile: ( item ) => dispatch(
            addAlbumToPlay( item )
        ),
        // updatePlayingList: ( item ) => dispatch(
        //     updatePlaylistToPlay( item )
        // ),

    }
};

const AlbumContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Album);

export default AlbumContainer