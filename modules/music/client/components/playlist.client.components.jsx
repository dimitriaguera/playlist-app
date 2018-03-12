import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get, put, del } from 'core/client/services/core.api.services'
import {
  playOnPlaylist,
  updatePlaylistToPlay,
  activatePlaylist,
  pauseState,
  playState
} from 'music/client/redux/actions'
import { mustUpdate } from 'music/client/helpers/music.client.helpers'
import socketServices from 'core/client/services/core.socket.services'
import Tracks from './tracks/tracks.client.components'
import DraggableList from 'draggable/client/components/draggableList'
import InfoPanelPlaylist from './infoPanel/infoPanelPlaylist.client.components'


class Playlist extends Component {
  constructor (props) {
    super(props);

    this.handlerClearPlaylist = this.handlerClearPlaylist.bind(this);
    this.handlerReadFile = this.handlerReadFile.bind(this);
    this.handlerDeleteTrack = this.handlerDeleteTrack.bind(this);
    this.handlerMoveItem = this.handlerMoveItem.bind(this);
    this.handlerDeletePlaylist = this.handlerDeletePlaylist.bind(this);
    this.handlerAddTracks = this.handlerAddTracks.bind(this);

    this.socket = socketServices.getPublicSocket();
    this.state = {
      playlist: {
        title: '',
        tracks: [],
        author: {}
      }
    }
  }

  componentWillMount () {
    const _self = this;
    const title = _self.props.match.params.title;
    const { history } = _self.props;

    // On mounting component, exact playlist title from url.
    // And fetch it to server.
    this.props.getPlaylist(title)
      .then((data) => {
        if (!data.success) {
          return history.push('/not-found');
        }
        _self.setState({
          playlist: data.msg
        })
      });

    // Listen save playlist event.
    // If updated playlist match to current displayed playlist, update it.
    this.socket.on('save:playlist', (data) => {
      if (mustUpdate(this.state.playlist, data)) {
        _self.setState({ playlist: data })
      }
    });
  }

  // Unmount and delete socket.
  componentWillUnmount () {
    this.socket.disconnect();
    console.log('Disconnecting Socket as component will unmount');
  }

  // Play a track in playlist.
  handlerReadFile (key) {
    const { playlist } = this.state;

    const { isPaused, onPlay, onPauseFunc, onPlayFunc } = this.props;

    return (e) => {

      if (playlist.tracks[key]._id === onPlay._id) {
        if (isPaused) {
          return onPlayFunc();
        } else {
          return onPauseFunc();
        }
      }

      this.props.readFile({
        pl: playlist,
        onPlayIndex: key
      });
      e.preventDefault();
    }
  }

  // Delete a track in playlist.
  handlerDeleteTrack (key) {
    const title = this.props.match.params.title;

    return (e) => {
      const { playlist } = this.state;
      const tracks = playlist.tracks;

      // Delete item in tracks array.
      tracks.splice(key, 1);

      // Save updated playlist.
      this.props.savePlaylist(title, tracks);

      e.preventDefault();
    }
  }

  // Delete all tracks in playlist.
  handlerClearPlaylist () {
    const { savePlaylist } = this.props;
    const { playlist } = this.state;

    // Save tracks in DB.
    return savePlaylist(playlist.title, []);
  }

  // Move a track in playlist.
  handlerMoveItem (prevItems, nextItems, _drag) {
    const { savePlaylist } = this.props;
    const { playlist } = this.state;

    // Saving updated playlist.
    return savePlaylist(playlist.title, nextItems)
      .then((data) => {
        // If playlist not updated server side, return to previous ordered list.
        if (!data.success) {
          _drag.setState({
            items: prevItems
          });
        }
      });
  }

  // Delete a playlist.
  handlerDeletePlaylist () {
    const { playlist } = this.state;
    const { history, deletePlaylist } = this.props;

    // Saving updated playlist.
    return deletePlaylist(playlist.title)
      .then((data) => {
        if (data.success) {
          history.push('/');
        }
      });
  }

  handlerAddTracks() {
    this.props.activatePlaylist(this.state.playlist);
    this.props.history.push('/music');
  }


  render () {
    const { playlist } = this.state;
    const { playingList, isPaused, user, history } = this.props;
    const { onPlayIndex, pl } = playingList;
    const isActivePlaylist = mustUpdate(pl, playlist);
    const isAuthor = user && playlist.author && playlist.author.username === user.username;

    let label_mode = 'Playlist';

    return (
      <section className='pal grid-3 has-gutter'>

        <header>
          {playlist && <InfoPanelPlaylist item={playlist}/>}

          {isAuthor &&
          <div className='pl-action-cont'>
            <button className='btn btn-standard' onClick={this.handlerAddTracks}>
              Add tracks
            </button>
            <button className='btn btn-standard' onClick={this.handlerClearPlaylist}>
              Remove all tracks
            </button>
            <button className='btn btn-standard' onClick={this.handlerDeletePlaylist}>
              Delete Playlist
            </button>
          </div>
          }
        </header>

        <div className='col-2-medium-3-small-3'>
          <div className='w-max-l'>
            <div className='move-tracks-items-row-header'>
              <span className='tracks-item-img'></span>
              <span className='title'>Title</span>
              <span className='artist'>Artist</span>
              <span className='album'>Album</span>
              <span className='time'>Time</span>
              <span className='tracks-item-menu'></span>
            </div>
            <DraggableList
              items={playlist.tracks}
              component={Tracks}
              dragActive={isAuthor}
              canEdit={isAuthor}
              isPaused={isPaused}
              history={history}
              isActivePlaylist={isActivePlaylist}
              onPlayIndex={onPlayIndex}
              callbackMouseUp={this.handlerMoveItem}
              onDelete={this.handlerDeleteTrack}
              onPlay={this.handlerReadFile}
              scrollContainerName='main-content'
            />
          </div>
        </div>
      </section>
    );
  }
}

const mapStateToProps = state => {
  return {
    playingList: state.playlistStore.playingList,
    isPaused: state.playlistStore.pause,
    onPlay: state.playlistStore.onPlay,
    user: state.authenticationStore._user
  }
};

const mapDispatchToProps = dispatch => {
  return {
    getPlaylist: (title) => dispatch(
      get(`playlist/${title}`)
    ),
    readFile: (item) => dispatch(
      playOnPlaylist(item)
    ),
    updatePlayingList: (item) => dispatch(
      updatePlaylistToPlay(item)
    ),
    savePlaylist: (title, tracks) => dispatch(
      put(`playlist/${title}`, {data: {tracks: tracks}})
    ),
    deletePlaylist: (title) => dispatch(
      del(`playlist/${title}`)
    ),
    activatePlaylist: (item) => dispatch(
      activatePlaylist(item)
    ),
    onPauseFunc: () => dispatch(
      pauseState()
    ),
    onPlayFunc: () => dispatch(
      playState()
    )
  }
};

const PlaylistContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Playlist);

export default PlaylistContainer
