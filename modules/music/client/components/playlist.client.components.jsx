import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get, put, del } from 'core/client/services/core.api.services'
import { playOnPlaylist, updatePlaylistToPlay } from 'music/client/redux/actions'
import { mustUpdate } from 'music/client/helpers/music.client.helpers'
import socketServices from 'core/client/services/core.socket.services'
import Tracks from './tracks.client.components'
import { Divider, Label, Button } from 'semantic-ui-react'

import DraggableList from 'draggable/client/components/draggableList'

class Playlist extends Component {

    constructor( props ) {

        super(props);

        this.handlerClearPlaylist = this.handlerClearPlaylist.bind(this);
        this.handlerReadFile = this.handlerReadFile.bind(this);
        this.handlerDeleteTrack = this.handlerDeleteTrack.bind(this);
        this.handlerMoveItem = this.handlerMoveItem.bind(this);
        this.handlerDeletePlaylist = this.handlerDeletePlaylist.bind(this);

        this.socket = socketServices.getPublicSocket();
        this.state = {
            playlist: {
                title: '',
                tracks: [],
                author: {},
            },
        }
    }

    componentWillMount() {
        const _self = this;
        const title = _self.props.match.params.title;
        const { history } = _self.props;

        // On mounting component, exact playlist title from url.
        // And fetch it to server.
        this.props.getPlaylist(title)
            .then( (data) => {
                if ( !data.success ) {

                    return history.push('/not-found');
                }
                _self.setState({
                    playlist: data.msg,
                })
            });

        // Listen save playlist event.
        // If updated playlist match to current displayed playlist, update it.
        this.socket.on('save:playlist', (data) => {
            if( mustUpdate(this.state.playlist, data) ) {
                _self.setState({ playlist: data })
            }
        });
    }

    // Unmount and delete socket.
    componentWillUnmount() {
        this.socket.disconnect();
        console.log("Disconnecting Socket as component will unmount");
    }

    // Play a track in playlist.
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

    // Delete a track in playlist.
    handlerDeleteTrack( key ) {

        const title = this.props.match.params.title;

        return (e) => {

            const { playlist } = this.state;
            const tracks = playlist.tracks;

            // Delete item in tracks array.
            tracks.splice(key, 1);

            // Save updated playlist.
            this.props.savePlaylist( title, tracks );

            e.preventDefault();
        }
    }

    // Delete all tracks in playlist.
    handlerClearPlaylist() {

        const { savePlaylist } = this.props;
        const { playlist } = this.state;

        // Save tracks in DB.
        return savePlaylist( playlist.title, [] );
    }

    // Move a track in playlist.
    handlerMoveItem( prevItems, nextItems, _drag ) {

        const { savePlaylist } = this.props;
        const { playlist } = this.state;

        // Saving updated playlist.
        return savePlaylist( playlist.title, nextItems )
            .then( (data) => {
                // If playlist not updated server side, return to previous ordered list.
                if(!data.success) {
                    _drag.setState({
                        items: prevItems,
                    });
                }
            });
    }

    // Delete a playlist.
    handlerDeletePlaylist() {

        const { playlist } = this.state;
        const { history, deletePlaylist } = this.props;

        // Saving updated playlist.
        return deletePlaylist( playlist.title )
            .then( (data) => {
                if(data.success) {
                    history.push('/');
                }
            });
    }

    render(){

        const { playlist } = this.state;
        const { playingList, isPaused, user, history } = this.props;
        const { onPlayIndex, pl } = playingList;
        const isActivePlaylist = mustUpdate(pl, playlist);
        const isAuthor = user && (playlist.author.username === user.username);

            let label_mode = 'Playlist';

        return (
            <div>
                <Label color='teal' style={{textTransform:'uppercase'}}>{label_mode}</Label>
                <h1>{playlist.title}</h1>

                {isAuthor &&
                <div>
                    {/*Add tracks button.*/}
                    <Button onClick={() => history.push(`/indexMusic?pl=${playlist.title}`)} icon basic inverted>
                        Add tracks
                    </Button>

                    {/*Clear all tracks button.*/}
                    <Button onClick={this.handlerClearPlaylist} icon basic inverted>
                        Clear all
                    </Button>
                </div>}

                <Divider/>

                <DraggableList
                    items={playlist.tracks}
                    component={Tracks}
                    dragActive={isAuthor}
                    canEdit={isAuthor}
                    isPaused={isPaused}
                    isActivePlaylist={isActivePlaylist}
                    onPlayIndex={onPlayIndex}
                    callbackMouseUp={this.handlerMoveItem}
                    onDelete={this.handlerDeleteTrack}
                    onPlay={this.handlerReadFile}
                />
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        playingList: state.playlistStore.playingList,
        isPaused: state.playlistStore.pause,
        onPlay: state.playlistStore.onPlay,
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
        deletePlaylist: ( title ) => dispatch(
            del( `playlist/${title}` )
        ),
    }
};

const PlaylistContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Playlist);

export default PlaylistContainer