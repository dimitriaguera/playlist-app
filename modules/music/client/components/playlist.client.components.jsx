import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get, put } from 'core/client/services/core.api.services'
import { playOnPlaylist, updatePlaylistToPlay } from 'music/client/redux/actions'
import socketServices from 'core/client/services/core.socket.services'
import PlaylistItem from 'music/client/components/playlistItem.client.components'
import MenuEditPlaylist from 'music/client/components/menuEditPlaylist.client.components'
import { Item, Divider, Header, Segment } from 'semantic-ui-react'

import DraggableList from 'music/client/components/draggableList'

class Playlist extends Component {

    constructor( props ) {

        super( props );

        this.handlerSavePlaylist = this.handlerSavePlaylist.bind(this);
        this.handlerReadFile = this.handlerReadFile.bind(this);
        this.handlerDelete = this.handlerDelete.bind(this);
        this.handlerMoveItem = this.handlerMoveItem.bind(this);

        this.socket = socketServices.getPublicSocket();
        this.state = {
        playlist: {
                title: '',
                tracks: [],
            },
        }
    }

    componentWillMount() {
        const _self = this;
        const title = _self.props.match.params.title;
        const { history } = _self.props;

        this.props.getPlaylist(title)
            .then( (data) => {
                if ( !data.success ) {

                    return history.push('/not-found');
                }
                _self.setState({
                    playlist: data.msg,
                })
            });

        this.socket.on('save:playlist', (data) => {
            if( this.state.playlist.title === data.title ) {
                _self.setState({ playlist: data })
            }
        });
    }

    componentWillUnmount() {
        this.socket.disconnect();
        console.log("Disconnecting Socket as component will unmount");
    }

    handlerReadFile( key ) {

        const { playlist } = this.state;

        return (e) => {

            this.props.readFile({
                pl: playlist,
                onPlayIndex: key,
            });
            e.preventDefault();
        }
    }

    handlerDelete( key ) {

        const title = this.props.match.params.title;

        return (e) => {

            const { playingList, updatePlayingList } = this.props;
            const { playlist } = this.state;
            const tracks = playlist.tracks;

            // Delete item in tracks array.
            tracks.splice(key, 1);

            // Save updated playlist.
            this.props.savePlaylist( title, tracks );

            e.preventDefault();
        }
    }

    handlerSavePlaylist( items ) {

        // Save tracks in DB.
        const { playlist } = this.state;
        this.props.savePlaylist( playlist.title, items );
    }

    handlerMoveItem( items, lastIndex, currentIndex ) {

        const { playingList, updatePlayingList, savePlaylist } = this.props;
        const { playlist } = this.state;

        // Saving updated playlist.
        savePlaylist( playlist.title, items );
    }

    render(){

        const { playlist } = this.state;
        const { playingList, isPaused, isAuthenticated, user } = this.props;
        const { onPlayIndex, pl } = playingList;
        const isActivePlaylist = pl && (pl.title === playlist.title);

        return (
                <DraggableList
                    items={playlist.tracks}
                    dragActive={isAuthenticated}
                    callbackMouseUp={this.handlerMoveItem}
                    component={PlaylistItem}
                    user={user}
                    isPaused={isPaused}
                    isActivePlaylist={isActivePlaylist}
                    onPlayIndex={onPlayIndex}
                    onDelete={this.handlerDelete}
                    onPlay={this.handlerReadFile}
                />
        );
    }
}

const mapStateToProps = state => {
    return {
        playingList: state.playlistStore.playingList,
        isPaused: state.playlistStore.pause,
        onPlay: state.playlistStore.onPlay,
        isAuthenticated: state.authenticationStore.isAuthenticated,
        user: state.authenticationStore._user,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        getPlaylist: ( title ) => dispatch(
            get( `playlist/${title}` )
        ),
        readFile: ( item ) => dispatch(
            playOnPlaylist( item )
        ),
        updatePlayingList: ( item ) => dispatch(
            updatePlaylistToPlay( item )
        ),
        savePlaylist: ( title, tracks ) => dispatch(
            put( `playlist/${title}`, {data:{tracks:tracks}} )
        ),
    }
};

const PlaylistContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Playlist);

export default PlaylistContainer