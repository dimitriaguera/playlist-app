import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get, post } from 'core/client/services/core.api.services'
import { playOnAlbum } from 'music/client/redux/actions'
import ps from 'folder/client/services/path.client.services'
import { Button, Icon } from 'semantic-ui-react'

import style from './style/albumTracks.scss'

class AlbumTracks extends Component {

    constructor(props){
        super(props);

        this.handlerOpenAlbum = this.handlerOpenAlbum.bind(this);
        this.handlerPlayAlbum = this.handlerPlayAlbum.bind(this);
        this.handlerAddTracks = this.handlerAddTracks.bind(this);

        this.state = {
            album: props.album,
            tracks: [],
            open: false,
        };
    }


    handlerOpenAlbum(e) {

        const _self = this;
        const { tracks, open } = this.state;
        const { search, album } = this.props;

        if(!open) {
            if( tracks.length === 0 ) {
                search(`tracks?fi=meta.album&q="${album.name}"&exact=true`)
                    .then((data) => {
                        if (data.success) {
                            const docs = data.msg.hits.hits;
                            const tracks = docs.map((item) => item._source);
                            _self.setState({tracks: tracks, open: true});
                        }
                    });
            }
        }
        else {
            _self.setState({tracks: [], open: false});
        }
    }

    handlerPlayAlbum(e, i) {

        const { tracks } = this.state;
        const { album, addAlbumToPlay } = this.props;

        const data = {
            onPlayIndex: i,
            pl: {
                title: album.name,
                path: album.path,
                tracks: tracks,
            }
        };

        addAlbumToPlay( data );
    }

    handlerAddTracks(e, item) {

        const { addPlaylistItems, activePlaylist, user } = this.props;

        // User must be connected to add tracks.
        if ( !user ) return history.push('/login');

        // May be an array of several tracks.
        let tracksID;

        console.log(item);

        // If just one item, build array with only one track.
        if( !item ){
            tracksID = this.state.tracks.map((track) => track.tracksId);
            console.log(1);
        }
        else if ( !Array.isArray( item ) ) {
            tracksID = [item.tracksId];
            console.log(2);
        }
        else {
            tracksID = item.map((track) => track.tracksId);
            console.log(3);
        }

        console.log(tracksID);

        const data = {
            tracks: tracksID
        };

        // Add tracks into activated Playlist.
        addPlaylistItems( activePlaylist.title, data );
        if( e ) e.preventDefault();
    }

    render(){

        const { className, user } = this.props;
        const { tracks } = this.state;

        return (
            <div className={className}>
                <div onClick={this.handlerOpenAlbum}>
                    {this.props.children}
                </div>
                <div className='album-tracks'>
                {
                 tracks.map((item, i) => {
                        return (
                            <div key={i}>
                                {item.meta.title}
                                <span className='fol-item-menu-inner'>
                                    <Button onClick={(e) => this.handlerPlayAlbum(e, i)} icon basic color="teal">
                                      <Icon name='play' />
                                    </Button>
                                    <Button onClick={(e) => this.handlerAddTracks(e, item)} disabled={!user} icon basic color="teal">
                                      <Icon name='plus' />
                                    </Button>
                                </span>
                            </div>
                        )
                    })
                }
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        user: state.authenticationStore._user,
        activePlaylist: state.playlistStore.activePlaylist,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        search: ( query ) => dispatch(
            get(`search/${query}`)
        ),
        addAlbumToPlay: ( item ) => {
            // Search first track on list.
            const track = item.pl.tracks[0];
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