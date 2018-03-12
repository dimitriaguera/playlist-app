import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import {connect} from "react-redux";
import { post } from 'core/client/services/core.api.services'
import IconPlayAnim from 'music/client/components/iconPlayAnim/iconPlayAnim.client.components'
import { playOnAlbum, pauseState, playState } from 'music/client/redux/actions'
import defaultCover from 'assets/images/default_cover.png'
import ps from 'core/client/services/core.path.services'
import Img from 'music/client/components/image/image.client.components'

class InfoPanel extends Component {

  constructor (props) {
    super(props);
    this.handlerPlayAlbum = this.handlerPlayAlbum.bind(this);
    this.handlerAddTracks = this.handlerAddTracks.bind(this);
  }

  // Handler to add recursively all tracks on playlist.
  handlerPlayAlbum (e) {
    const {pause, album, tracks, mode, onPauseFunc, onPlayFunc, onPlay, addAlbumToPlay} = this.props;

    // If this album already playing.
    if (mode === 'album' && onPlay.albumKey === album.key) {
      if (pause) {
        return onPlayFunc();
      } else {
        return onPauseFunc();
      }
    }

    // Else, play this album.
    else {
      // Build album data to store, and index to play.
      const albumToPlay = {
        pl: {
          title: album.name,
          key: album.key,
          tracks: tracks,
          item: album,
        },
        onPlayIndex: 0
      };
      // Store new playing album.
      addAlbumToPlay(albumToPlay);
    }
  }

  handlerAddTracks (e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const { tracks, addPlaylistItems, activePlaylist, user, history, location } = this.props;

    // Get id from tracks.
    const tracksId = tracks.map(item => item.tracksId);

    // User must be connected to add tracks.
    if (!user) return history.push({pathname: '/login', state: {from: location.pathname }});

    // Add tracks into activated Playlist.
    if (activePlaylist) addPlaylistItems(activePlaylist.title, {tracks: tracksId});
  }

  render() {
    const {album,  pause, onPlay, onPlayFunc, onPauseFunc} = this.props;
    const artist = album.albumartist || album.artist;

    // Get cover path
    let cover = '';
    if( album.key ) cover = ps.changeSeparator(album.key, '___', '/');

    // Does this album is now playing ?
    const albumIsPlaying = onPlay.albumKey === album.key;

    const getButton = () => {
      if (albumIsPlaying) {
        if (pause) {
          return (
            <button aria-label='resume play album' onClick={onPlayFunc} className='btn btn-icon big'>
              <i aria-hidden='true' className='icon icon-pause'/>
            </button>
          )
        }
        else {
          return (
            <button aria-label='pause album' onClick={onPauseFunc} className='btn btn-icon big'>
              <IconPlayAnim onClick={pause}/>
            </button>
          )
        }
      }
      else {
        return (
          <button aria-label='play album' onClick={this.handlerPlayAlbum} className='btn btn-icon big'>
            <i aria-hidden='true' className='icon icon-play'/>
          </button>
        )
      }
    };

    return (
      <div className='info-panel'>
        <div className='info-panel-img'>
          <Img title={`${album.name} cover`}
               src={'/pictures/' + cover + '/cover.jpg'}
               defaultSrc={defaultCover}
          />
        </div>
        <div className='info-panel-meta'>
          {album.name && <span className='name'>{album.name}</span>}
          <span className='genre'>
          {album.genre.map((g, i) => <span key={i}>{g}</span>)}
        </span>
          {artist && <span className='artist'>{artist}</span>}
          {album.year && <span className='year'>{album.year}</span>}
          {album.label && <span className='label'>{album.label}</span>}
          {(album.diskno && album.diskno !== '0') &&
          <span className='diskno'>{`disk ${album.diskno} / ${album.diskof}`}</span>}
        </div>
        <div className='info-panel-menu'>
          {getButton()}
          <button aria-label='add album tracks to playlist' onClick={this.handlerAddTracks} className='btn btn-icon big'><i
            aria-hidden='true' className='icon icon-plus'/></button>
        </div>
      </div>
    )
  }
}

const mapStateToProps = state => {
  return {
    user: state.authenticationStore._user,
    pause: state.playlistStore.pause,
    onPlay: state.playlistStore.onPlay,
    mode: state.playlistStore.mode,
    activePlaylist: state.playlistStore.activePlaylist,
  }
};

const mapDispatchToProps = dispatch => {
  return {
    onPlayFunc: () => dispatch(playState()),
    onPauseFunc: () => dispatch(pauseState()),
    addAlbumToPlay: (item) => {
      dispatch(playOnAlbum(item));
    },
    addPlaylistItems: (title, items) => dispatch(
      post(`playlist/${title}`, {
        data: items
      })
    )
  }
};

const InfoPanelContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(InfoPanel);

export default InfoPanelContainer

