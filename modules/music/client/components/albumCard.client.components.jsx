import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get, post } from 'core/client/services/core.api.services'
import { playOnAlbum } from 'music/client/redux/actions'
import ps from 'core/client/services/core.path.services'
import Img from 'music/client/components/image.client.components'
import IconPlayAnim from 'music/client/components/iconPlayAnim.client.components'
import { Icon } from 'semantic-ui-react'

import style from './style/albumCard.scss'

class AlbumCard extends Component {

    constructor(props){
        super(props);

        this.handlerOpenAlbum = this.handlerOpenAlbum.bind(this);
        this.handlerPlayAlbum = this.handlerPlayAlbum.bind(this);
        this.handlerAddTracks = this.handlerAddTracks.bind(this);

        this.domElmt = {
            card: null,
            label: null,
        };
    }

    shouldComponentUpdate(nextProps) {
        return false;
    }

    componentWillReceiveProps(nextProps) {
        if(this.props.playingAlbumKey === this.props.album.key && nextProps.playingAlbumKey !== this.props.album.key){
            this.domElmt.card.classList.remove('playing');
        }
        else if(this.props.album.key === nextProps.playingAlbumKey) {
            this.domElmt.card.classList.add('playing');
        }
    }

    getAlbumTracks(callback) {
        const { search, album } = this.props;
        return search(`tracks?fi=albumKey&sort=meta.track.no&q=${album.key}&exact=true`)
            .then((data) => {

                if (!data.success) {
                    return callback(data);
                }

                // No-mutate album.
                const albumWithTracks = Object.assign({}, album);
                // Add tracks.
                albumWithTracks.tracks = data.msg.hits.hits.map((item) => item._source);
                // Call callback.
                callback(null, albumWithTracks);
            });
    }

    handlerOpenAlbum(e) {

        const _self = this;
        const { album, createInfoTab } = this.props;

        const promise = new Promise((resolve, reject) => {
            _self.getAlbumTracks( (err, album) => {
                if(err) return reject(err);
                resolve(album);
            });
        });

        createInfoTab(_self.domElmt, album, promise);
    }

    handlerPlayAlbum(e, i) {

        const { addAlbumToPlay } = this.props;

        this.getAlbumTracks( (err, album) => {
            if(!err) {
                const data = {
                    onPlayIndex: i || 0,
                    pl: {
                        title: album.name,
                        path: album.path,
                        tracks: album.tracks,
                    }
                };
                addAlbumToPlay(data);
            }
        });
    }

    handlerAddTracks(e) {

        const { addPlaylistItems, activePlaylist, user } = this.props;

        // User must be connected to add tracks.
        if ( !user ) return history.push('/login');

        this.getAlbumTracks( (err, album) => {
            if(!err){
                // Extract tracks id from album.
                const tracksID = album.tracks.map(t => t.tracksId);
                // Add tracks into activated Playlist.
                addPlaylistItems( activePlaylist.title, {tracks: tracksID} );
            }
        });
        if( e ) e.stopPropagation();
    }

    render(){

        const { style, album, playingAlbumKey } = this.props;
        const cover = ps.changeSeparator(album.key, '___', '/');
        //const playingClass = playingAlbumKey === album.key ? ' playing' : '';

        console.log('RENDER CARD');

        return (
            <div ref={(r) => {this.domElmt.card = r}} style={style} className={`albums-item-album`}>

                <div className={`albums-item-img`} onClick={this.handlerPlayAlbum}>
                    <Img title={`${album.name} cover`}
                         src={'pictures/' + cover + '/cover.jpg'}
                         defaultSrc='static/images/default_cover.png'
                         width="150" height="150"
                    />
                    <IconPlayAnim wrapperStyle={{width:'100%', height:'100%'}}/>
                    <Icon color='teal' circular inverted name='play'/>
                    <Icon color='teal' circular inverted name='plus' onClick={this.handlerAddTracks}/>
                </div>

                <div ref={(r) => {this.domElmt.label = r}} className='albums-item-info' onClick={this.handlerOpenAlbum}>
                    <div className='name'>{album.name}</div>
                    <div className='date'>{album.year}</div>
                    <div className='artist'><span>{album.artist}</span></div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        user: state.authenticationStore._user,
        activePlaylist: state.playlistStore.activePlaylist,
        playingAlbumKey: state.playlistStore.onPlay.albumKey,
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

const AlbumCardContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(AlbumCard);


export default AlbumCardContainer