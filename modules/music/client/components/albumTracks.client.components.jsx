import React, { Component } from 'react'
import { connect } from 'react-redux'
import { post } from 'core/client/services/core.api.services'
import { playOnAlbum } from 'music/client/redux/actions'
import { Button, Icon } from 'semantic-ui-react'

import style from './style/albumTracks.scss'

class AlbumTracks extends Component {

    constructor(props){
        super(props);
        this.handlerPlayAlbum = this.handlerPlayAlbum.bind(this);
    }

    // Handler to add recursively all tracks on playlist.
    handlerPlayAlbum( e, i ) {
        const {album, onPlay, addAlbumToPlay} = this.props;

        // If this album already playing.
        if( onPlay.albumKey === album.key ) {
            addAlbumToPlay({onPlayIndex: i});
        }

        // Else, play this album.
        else {
            const albumToPlay = {
                pl: {
                    title: album.name,
                    path: album.path,
                    tracks: album.tracks,
                },
                onPlayIndex: i,
            };
            addAlbumToPlay(albumToPlay);
        }
    }

    handlerAddTrack(e, tracksId) {

        const { addPlaylistItems, activePlaylist, user } = this.props;

        // User must be connected to add tracks.
        if ( !user ) return history.push('/login');

        const data = {
            tracks: [tracksId],
        };

        // Add tracks into activated Playlist.
        addPlaylistItems( activePlaylist.title, data );
        if( e ) e.preventDefault();
    }

    render(){

        const { album, style, user, onPlay, onPlayIndex } = this.props;
        const albumIsPlaying = onPlay.albumKey === album.key;

        return (
            <div className='album-tracks' style={style}>
                {
                    album.tracks && album.tracks.map((item, i) => {
                        const trackIsPlaying = (albumIsPlaying && (onPlayIndex === i)) ? 'playing' : '';
                        return (
                            <div key={i} className={trackIsPlaying}>
                            <span className='fol-item-menu-inner'>
                                <Button size='mini' onClick={(e) => this.handlerPlayAlbum(e, i)} icon basic color="teal">
                                  <Icon name='play' />
                                </Button>
                                <Button size='mini' onClick={(e) => this.handlerAddTrack(e, item.tracksId)} disabled={!user} icon basic color="teal">
                                  <Icon name='plus' />
                                </Button>
                            </span>
                                <span>
                                {item.meta.title}
                            </span>
                            </div>
                        )
                    })
                }
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        user: state.authenticationStore._user,
        onPlay: state.playlistStore.onPlay,
        activePlaylist: state.playlistStore.activePlaylist,
        onPlayIndex: state.playlistStore.playingList.onPlayIndex,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        addAlbumToPlay: ( item ) => {
            // Add album to store.
            dispatch(playOnAlbum(item));
        },
        addPlaylistItems: ( title, items ) => dispatch(
            post( `playlist/${title}`, {
                data: items,
            } )
        ),
    }
};

const AlbumTracksContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(AlbumTracks);


export default AlbumTracksContainer