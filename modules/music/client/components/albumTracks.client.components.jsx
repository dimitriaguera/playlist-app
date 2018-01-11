import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Motion, spring } from 'react-motion'
import { post } from 'core/client/services/core.api.services'
import { playOnAlbum } from 'music/client/redux/actions'
import IconPlayAnim from 'music/client/components/iconPlayAnim.client.components'
import { Button, Icon } from 'semantic-ui-react'

import style from './style/albumTracks.scss'

class AlbumTracks extends Component {

    constructor(props){
        super(props);

        this.state = {
          tracks: [],
        };

        this.handlerPlayAlbum = this.handlerPlayAlbum.bind(this);
    }

    componentDidMount() {
        const _self = this;
        const { getAlbumTracks, sameRow } = this.props;
        const delay = sameRow ? 0 : 300;

        // Start fetching album tracks, with minimal delay before call setState.
        // This delay is needed to avoid lag during albumCard open anim.
        this.waitForAnimEnd(delay, getAlbumTracks, (err, data) => {
            if(!err){
                _self.setState({tracks: data.tracks});
            }
        });
    }

    componentWillUnmount() {
        // Clear delay.
        clearTimeout(this.timeoutID);
    }

    waitForAnimEnd(delay, fn, callback){
        let timeout = false;
        let close = null;

        // Catcher async result function.
        function proceed(err, data) {
            // If delay not ok, store callback with result.
            if(!timeout) {
                return close = () => {
                    callback(err, data);
                }
            }
            // If delay ok, directly exec callback function.
            callback(err, data);
        }

        // Start async function.
        fn(proceed);

        // Start timer.
        this.timeoutID = setTimeout(() => {
            timeout = true;
            if(close) {
                return close();
            }
        }, delay);
    }

    // Handler to add recursively all tracks on playlist.
    handlerPlayAlbum( e, i ) {
        const {album, mode, onPlay, addAlbumToPlay} = this.props;

        // If this album already playing.
        if( mode === 'album' && onPlay.albumKey === album.key ) {
            addAlbumToPlay({onPlayIndex: i});
        }

        // Else, play this album.
        else {
            const albumToPlay = {
                pl: {
                    title: album.name,
                    path: album.path,
                    tracks: this.state.tracks,
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

        // Add tracks into activated Playlist.
        addPlaylistItems( activePlaylist.title, {tracks: [tracksId]} );
        if( e ) e.preventDefault();
    }

    getStyle() {
        const {index, grid, card} = this.props;
        const pos = index % grid.row;

        return {
            width: ((grid.row * card.width) - (card.margin * 2)) + 'px',
            left: (-pos * card.width) + card.margin + 'px',
            top: card.height + 'px',
        }
    }

    render(){

        const { album, user, onPlay, onPlayIndex } = this.props;
        const { tracks } = this.state;
        const albumIsPlaying = onPlay.albumKey === album.key;
        const style = this.getStyle();

        return (
            <div className='album-tracks' style={style}>
                {!!tracks.length &&
                <Motion defaultStyle={{o: 0}} style={{o: spring(1)}}>
                    {s => <div style={{opacity: s.o}}>
                        {tracks.map((item, i) => {
                            const trackIsPlaying = (albumIsPlaying && (onPlayIndex === i));
                            const trackClass = trackIsPlaying ? 'playing' : '';
                            return (
                                <div key={i} className={trackClass}>
                                    {trackIsPlaying &&
                                    <IconPlayAnim iconStyle={{width: '30px', height: '30px', padding: '7px'}}/>
                                    }
                                    {!trackIsPlaying &&
                                    <Button size='mini' onClick={(e) => this.handlerPlayAlbum(e, i)} icon basic
                                            color="teal">
                                        <Icon name='play'/>
                                    </Button>
                                    }
                                    <span className='album-tracks-menu-inner'>
                                        <Button size='mini' onClick={(e) => this.handlerAddTrack(e, item.tracksId)}
                                                disabled={!user} icon basic color="teal">
                                          <Icon name='plus'/>
                                        </Button>
                                    </span>
                                    <span className='album-tracks-title'>
                                        {item.meta.track.no !== '0' &&
                                        <span>{item.meta.track.no} - </span>
                                        }{item.meta.title}
                                    </span>
                                </div>
                            )
                        })
                    }</div>}
                </Motion>}
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        user: state.authenticationStore._user,
        onPlay: state.playlistStore.onPlay,
        onPlayIndex: state.playlistStore.playingList.onPlayIndex,
        mode: state.playlistStore.mode,
        activePlaylist: state.playlistStore.activePlaylist,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        addAlbumToPlay: ( item ) => {
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