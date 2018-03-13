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
import PlaylistTrack from './tracks/playlistTrack.client.components'
import AddPlaylist from 'music/client/components/playList/addPlaylist.client.components'
import DraggableList from 'draggable/client/components/draggableList'
import Modal from 'react-modal'


class Queue extends Component {
  constructor (props) {
    super(props);

    this.handleChangeCheckBox = this.handleChangeCheckBox.bind(this);
    this.handlerSavePlaylist = this.handlerSavePlaylist.bind(this);
    this.handlerClearPlaylist = this.handlerClearPlaylist.bind(this);
    this.handlerReadFile = this.handlerReadFile.bind(this);
    this.handlerDeleteTrack = this.handlerDeleteTrack.bind(this);
    this.handlerMoveItem = this.handlerMoveItem.bind(this);
    this.handlerAddTracks = this.handlerAddTracks.bind(this);

    this.socket = socketServices.getPublicSocket();
    this.state = {
      clearAfterSave: false,
      playlist: {
        title: '',
        tracks: []
      },
      modalIsOpen: false,

    }
  }

  componentWillMount () {
    const _self = this;
    const { history, user } = _self.props;

    // React Modal
    Modal.setAppElement("#root");

    if (!user) {
      return history.push('/not-found');
    }

    const title = `__def${user.username}`;

    // On mounting component, fetch user's queue.
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
    // If updated playlist match to queue, update it.
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

  // Make Form input controlled.
  handleChangeCheckBox(e){
    this.setState({
      clearAfterSave: e.target.checked
    })
  }


  // Play a track in queue.
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

  // Delete a track in queue.
  handlerDeleteTrack (key) {
    const { user } = this.props;
    const title = `__def${user.username}`;

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

  // Delete all tracks in queue.
  handlerClearPlaylist () {
    const { savePlaylist } = this.props;
    const { playlist } = this.state;

    // Save tracks in DB.
    return savePlaylist(playlist.title, []);
  }

  // Save queue tracks into a new playlist.
  // This action create a new playlist.
  handlerSavePlaylist () {
    const { clearAfterSave } = this.state;

    if (clearAfterSave) {
      // Save tracks in DB.
      return this.handlerClearPlaylist();
    }
  }

  // Move track in queue.
  handlerMoveItem (prevItems, nextItems, _drag) {
    const { savePlaylist } = this.props;
    const { playlist } = this.state;

    // Saving updated playlist.
    return savePlaylist(playlist.title, nextItems)
      .then((data) => {
        // If no update server side, return to previous queue order.
        if (!data.success) {
          _drag.setState({
            items: prevItems
          });
        }
      });
  }

  handlerAddTracks() {
    this.props.activatePlaylist(this.state.playlist);
    this.props.history.push('/music');
  }

  render () {
    const { playlist, modalIsOpen } = this.state;
    const { playingList, isPaused, isAuthenticated, user, history } = this.props;
    const { onPlayIndex, pl } = playingList;
    const isActivePlaylist = mustUpdate(pl, playlist);

    return (
      <section className='pal'>

        <span className='pl-mode'>Queue</span>
        <h1>Queue - {user.username}</h1>

        <span className='pl-tracks-nb'>Number of tracks : {playlist.tracks.length}</span>


        <div className='pl-action-cont'>
          {/* Save as playlist displayed only for Queue. */}
          {!!playlist.tracks.length &&
              <span>
                <button className='btn' onClick={() => this.setState({modalIsOpen: true})}>
                  Save As Playlist
                </button>

                <Modal
                  isOpen={modalIsOpen}
                  onRequestClose={() => this.setState({modalIsOpen: false})}
                  className="modal"
                  overlayClassName="modal-overlay"
                >

                  <h2 className="modal-title">
                    <i aria-hidden="true" className="icon icon-sound icon-xl"/>
                    Save current queue as playlist ?
                  </h2>

                  <div className="modal-content">
                    <p>Type the playlist's title you want to create.</p>
                  </div>

                  <div className="modal-actions-left">
                    <AddPlaylist
                      history={history}
                      tracksId={playlist.tracks}
                      validation='Save'
                      redirect
                      onSave={this.handlerSavePlaylist}/>
                    <input
                      id='clearAfterSave'
                      name='clearAfterSave'
                      className='checkbox'
                      type='checkbox'
                      checked={this.state.clearAfterSave}
                      onChange={this.handleChangeCheckBox}
                    />
                    <label htmlFor='clearAfterSave'>Clear queue after save</label>
                  </div>

                </Modal>
              </span>
          }
          <button className='btn' onClick={this.handlerAddTracks}>
            Add tracks
          </button>
          <button className='btn' onClick={this.handlerClearPlaylist}>
            Remove all tracks
          </button>
        </div>

        <DraggableList
          items={playlist.tracks}
          dragActive={isAuthenticated}
          callbackMouseUp={this.handlerMoveItem}
          component={PlaylistTrack}
          user={user}
          isPaused={isPaused}
          isActivePlaylist={isActivePlaylist}
          onPlayIndex={onPlayIndex}
          onDelete={this.handlerDeleteTrack}
          onPlay={this.handlerReadFile}
          scrollContainerName='main-content'
        />
      </section>
    );
  }
}

const mapStateToProps = state => {
  return {
    playingList: state.playlistStore.playingList,
    isPaused: state.playlistStore.pause,
    onPlay: state.playlistStore.onPlay,
    isAuthenticated: state.authenticationStore.isAuthenticated,
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

const QueueContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Queue);

export default QueueContainer
