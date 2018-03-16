import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { post } from 'core/client/services/core.api.services'
import IconPlayAnim from 'music/client/components/iconPlayAnim/iconPlayAnim.client.components'
import { playOnAlbum, pauseState, playState } from 'music/client/redux/actions'
import {connect} from "react-redux";

class AlbumInfo extends Component {

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
      <div className='album-info'>
        <div className='album-info-meta'>
          {album.name && <span className='name'>{album.name}</span>}
          <span className='genre'>
          {album.genre.map((g, i) => <span key={i}>{i !== 0 ? `, ${g}` : g}</span>)}
        </span>
          {artist && <span className='artist'>{artist}</span>}
          {album.year && <span className='year'>{album.year}</span>}
          {album.label && <span className='label'>{album.label}</span>}
          {(album.diskno && album.diskno !== '0') &&
          <span className='diskno'>{`disk ${album.diskno} / ${album.diskof}`}</span>}
        </div>
        <div className='album-info-menu'>
          {getButton()}
          <button aria-label='add album tracks to playlist' onClick={this.handlerAddTracks} className='btn btn-icon big'><i
            aria-hidden='true' className='icon icon-plus'/></button>
          <Link to={`/album/${album.key}`} title='to album page' className='btn btn-icon big'><i aria-hidden='true'
                                                                                                 className='icon icon-eye'/></Link>
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

const AlbumInfoContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AlbumInfo);

export default AlbumInfoContainer
