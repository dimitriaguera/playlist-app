import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get, put } from 'core/client/services/core.api.services'
import { addAlbumToPlay, playOnAlbum, updateAlbumToPlay } from 'music/client/redux/actions'
import Tracks from 'music/client/components/tracks.client.components'
import AddPlaylist from './addPlaylist.client.components'
import { Divider, Label, Button, Modal, Header, Icon } from 'semantic-ui-react'
import ps from 'folder/client/services/path.client.services'

import DraggableList from 'draggable/client/components/draggableList'

class Album extends Component {


    constructor( props ) {

        super( props );

        this.state = {
            isActive: false,
            albumOfUrl: {
                pl: null,
                onPlayIndex: 0,
            }
        };

        this.handlerMoveItem = this.handlerMoveItem.bind(this);
        this.handlerReadTrack = this.handlerReadTrack.bind(this);
        this.handlerSaveAsPlaylist = this.handlerSaveAsPlaylist.bind(this);
    }

    componentWillMount() {

        const _self = this;
        const { history, fetchFiles, albumList } = _self.props;

        let pathArray = ps.splitPath(_self.props.match.params.title);
        let path = ps.buildPath(pathArray);

        // Test if album is already playing.
        // If album playing, mount data from store.
        if( albumList.pl && albumList.pl.path === path ) {
            _self.setState({
                isActive: true,
                albumOfUrl: albumList,
            })
        }
        // Else, query data from DB.
        else {
            fetchFiles(ps.urlEncode(path))
                .then((data) => {

                    if (!data.success) {
                        return history.push('/not-found');
                    }

                    const album = {
                        title: pathArray[pathArray.length - 1],
                        path: path,
                        tracks: data.msg,
                    };

                    _self.setState({
                        isActive: false,
                        albumOfUrl: {
                            pl: album,
                            onPlayIndex: 0,
                        },
                    })
                });

        }
    }

    componentWillReceiveProps(nextProps) {

        const _self = this;
        const { albumList, fetchFiles, history } = nextProps;
        const { albumOfUrl } = this.state;

        // Force re-rendering on props location change.
        if ( _self.props.match.params.title !== nextProps.match.params.title ) {

            // Test if album is already playing.
            // Get and clean path.
            let pathArray = ps.splitPath(_self.props.match.params.title);
            let path = ps.buildPath(pathArray);

            // If album playing, mount data from store.
            if (albumList.pl && albumList.pl.path === path) {
                return _self.setState({
                    isActive: true,
                    albumOfUrl: albumList,
                })
            }
            // Else, query data from DB.
            else {
                return fetchFiles(ps.urlEncode(path))
                    .then((data) => {

                        if (!data.success) {
                            return history.push('/not-found');
                        }

                        const album = {
                            title: pathArray[pathArray.length - 1],
                            path: path,
                            tracks: data.msg,
                        };

                        _self.setState({
                            isActive: false,
                            albumOfUrl: {
                                pl: album,
                                onPlayIndex: 0,
                            },
                        })
                    });

            }
        }

        //Else. Props albumList comes from store, and isn't empty if album playing.
        if ( albumList !== this.props.albumList ) {

            // So checking if store's albumList is already current album in component's state.
            const isActive = ( albumList.pl && albumList.pl.path === albumOfUrl.pl.path );

            // If same album, copy changes in local state, and set isActive to true.
            this.setState({
                isActive: isActive,
                albumOfUrl: albumList,
                onPlayIndex: nextProps.onPlayIndex
            });
        }
    }

    handlerReadTrack( key ) {

        return (e) => {

            const { albumOfUrl } = this.state;
            const { pl } = albumOfUrl;

            this.props.playTrackAlbum({
                pl: pl,
                onPlayIndex: key,
            });
            e.preventDefault();
        }
    }

    handlerMoveItem( prevItems, nextItems ) {

        const { albumOfUrl } = this.state;
        const { albumList } = this.props;

        const oldTracks = prevItems;
        const newTracks = nextItems;

        let newIndex = albumOfUrl.onPlayIndex;

        // // If item playing moved, get his index.
        if( oldTracks[newIndex].src !== newTracks[newIndex].src ) {
            newIndex = getTrackIndexBySrc( oldTracks[newIndex].src, newTracks );
        }

        // Build album object.
        const data = {
            pl: Object.assign({}, albumOfUrl.pl, {tracks:nextItems}),
            onPlayIndex: newIndex
        };

        // Need to determine if changes must update playing album in state store,
        // or just update component state.
        // If this album mounted on component state is now playing, update via redux store.
        if ( albumList.pl && albumList.pl.path === albumOfUrl.pl.path ) {
            // Store updated album.
            return this.props.updateAlbumList( data );
        }

        // If this album isn'ot playing, just update local state.
        this.setState({
            albumOfUrl: data
        });

    }

    handlerSaveAsPlaylist( key ) {

        // return (e) => {
        //
        //     const { albumOfUrl } = this.state;
        //     const { pl } = albumOfUrl;
        //
        //     this.props.playTrackAlbum({
        //         pl: pl,
        //         onPlayIndex: key,
        //     });
        //     e.preventDefault();
        // }
    }

    render(){

        const { albumOfUrl, isActive } = this.state;
        const { isPaused, user, history } = this.props;
        const { onPlayIndex, pl } = albumOfUrl;

        return (
            <div>{ pl &&
                <div>
                    <Label color='teal' style={{textTransform:'uppercase'}}>Album</Label>
                    <h1>{pl.title}</h1>

                    {!! user &&
                    <Modal trigger={
                        <Button onClick={() => this.handlerSaveAsPlaylist} icon basic inverted>
                            Save As Playlist
                        </Button>
                    } basic size='small' closeIcon>
                        <Header icon='sound' content={`Save ${pl.title} as playlist ?`} />
                        <Modal.Content>
                            <p>Type the playlist's title you want to create.</p>
                            <AddPlaylist
                                history={history}
                                placeholder={`${pl.title}'s playlist`}
                                tracks={pl.tracks}
                                validation='Save'
                                redirect={true}
                            />
                        </Modal.Content>
                    </Modal>}

                    <Divider/>

                    <DraggableList
                        items={pl.tracks}
                        callbackMouseUp={this.handlerMoveItem}
                        component={Tracks}
                        isActivePlaylist={isActive}
                        user={user}
                        isPaused={isPaused}
                        onPlayIndex={onPlayIndex}
                        onPlay={this.handlerReadTrack}
                    />
                </div>
            }</div>
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
        fetchFiles: ( query ) => dispatch(
            get( `files?path=${query || ''}` )
        ),
        updateAlbumList: ( item ) => dispatch(
            updateAlbumToPlay( item )
        ),
        playTrackAlbum: ( item ) => dispatch(
            playOnAlbum( item )
        ),
    }
};

const AlbumContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Album);


// HELPER
function getTrackIndexBySrc( src, array ) {
    let l = array.length;
    for( let i=0; i < l; i++ ) {
        if( array[i].src == src ) return i;
    }
    return null;
}

export default AlbumContainer