import React, { Component } from 'react';
import { connect } from 'react-redux';
import { get, put, del } from 'core/client/services/core.api.services';
import {
  playOnPlaylist,
  updatePlaylistToPlay,
  activatePlaylist,
  pauseState,
  playState
} from 'music/client/redux/actions';

import { mustUpdate } from 'music/client/helpers/music.client.helpers';
import socketServices from 'core/client/services/core.socket.services';
import PlaylistTrack from './tracks/playlistTrack.client.components';
import AddPlaylist from 'music/client/components/playList/addPlaylist.client.components';
import DraggableList from 'draggable/client/components/draggableList';
import InfoPanelPlaylist from './infoPanel/infoPanelPlaylist.client.components';
import Modal from 'react-modal';

class Queue extends Component {
  constructor(props) {
    super(props);

    this.handleChangeCheckBox = this.handleChangeCheckBox.bind(this);
    this.handlerSavePlaylist = this.handlerSavePlaylist.bind(this);
    this.handlerClearPlaylist = this.handlerClearPlaylist.bind(this);
    this.handlerPlayTrack = this.handlerPlayTrack.bind(this);
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
      modalIsOpen: false
    };
  }

  componentWillMount() {
    const _self = this;
    const { history, user } = _self.props;

    // React Modal
    Modal.setAppElement('#root');

    if (!user) {
      return history.push('/not-found');
    }

    const title = `__def${user.username}`;

    // On mounting component, fetch user's queue.
    this.props.getPlaylist(title).then(data => {
      if (!data.success) {
        return history.push('/not-found');
      }
      _self.setState({
        playlist: data.msg
      });
    });

    // Listen save playlist event.
    // If updated playlist match to queue, update it.
    this.socket.on('save:playlist', data => {
      if (mustUpdate(this.state.playlist, data)) {
        _self.setState({ playlist: data });
      }
    });
  }

  // Unmount and delete socket.
  componentWillUnmount() {
    this.socket.disconnect();
    console.log('Disconnecting Socket as component will unmount');
  }

  // Make Form input controlled.
  handleChangeCheckBox(e) {
    this.setState({
      clearAfterSave: e.target.checked
    });
  }

  // Play a track in queue.
  handlerPlayTrack(key) {
    const { playlist } = this.state;

    const { isPaused, onPlay, onPauseFunc, onPlayFunc } = this.props;

    return e => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }

      if (playlist.tracks[key]._id === onPlay._id) {
        if (isPaused) {
          return onPlayFunc();
        } else {
          return onPauseFunc();
        }
      }

      this.props.playTrack({
        pl: playlist,
        onPlayIndex: key
      });
    };
  }

  // Delete a track in queue.
  handlerDeleteTrack(key) {
    const { user } = this.props;
    const title = `__def${user.username}`;

    return e => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }

      const { playlist } = this.state;
      const tracks = playlist.tracks;

      // Delete item in tracks array.
      tracks.splice(key, 1);

      // Save updated playlist.
      this.props.savePlaylist(title, tracks);
    };
  }

  // Delete all tracks in queue.
  handlerClearPlaylist() {
    const { savePlaylist } = this.props;
    const { playlist } = this.state;

    // Save tracks in DB.
    return savePlaylist(playlist.title, []);
  }

  // Save queue tracks into a new playlist.
  // This action create a new playlist.
  handlerSavePlaylist() {
    const { clearAfterSave } = this.state;

    if (clearAfterSave) {
      // Save tracks in DB.
      return this.handlerClearPlaylist();
    }
  }

  // Move track in queue.
  handlerMoveItem(prevItems, nextItems, _drag) {
    const { savePlaylist } = this.props;
    const { playlist } = this.state;

    // Saving updated playlist.
    return savePlaylist(playlist.title, nextItems).then(data => {
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

  render() {
    const { playlist, modalIsOpen } = this.state;
    const { playingList, isPaused, user, history } = this.props;
    const { onPlayIndex, pl } = playingList;
    const isActivePlaylist = mustUpdate(pl, playlist);
    const isAuthor = playlist.author && user.username === playlist.author.username;
    const headClasses = ['move-playlist-tracks-items-row-header'];
    if (isAuthor) headClasses.push('edit', 'drag');

    return (
      <section className="pal grid-3 has-gutter">
        <header className="col-1-medium-3-small-3">
          <div className="pl-action-cont mbm">
            <button className="btn btn-standard" onClick={this.handlerAddTracks}>
              Add tracks
            </button>
            {!!playlist.tracks.length && (
              <button
                className="btn btn-standard"
                onClick={this.handlerClearPlaylist}
              >
                Remove all tracks
              </button>
            )}
            {!!playlist.tracks.length && (
              <button
                className="btn btn-standard"
                onClick={() => this.setState({ modalIsOpen: true })}
              >
                Save As Playlist
              </button>
            )}
          </div>
          {playlist && <InfoPanelPlaylist item={playlist} />}
        </header>

        {!!playlist.tracks.length && (
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={() => this.setState({ modalIsOpen: false })}
            className="modal"
            overlayClassName="modal-overlay"
          >
            <h2 className="modal-title">
              <i aria-hidden="true" className="icon icon-sound icon-xl" />
              Save current queue as playlist ?
            </h2>

            <div className="modal-content">
              <p>Type the playlist's title you want to create.</p>
            </div>

            <div className="modal-actions-left">
              <AddPlaylist
                history={history}
                tracksId={playlist.tracks}
                validation="Save"
                redirect
                onSave={this.handlerSavePlaylist}
              />
              <input
                id="clearAfterSave"
                name="clearAfterSave"
                className="checkbox"
                type="checkbox"
                checked={this.state.clearAfterSave}
                onChange={this.handleChangeCheckBox}
              />
              <label htmlFor="clearAfterSave">Clear queue after save</label>
            </div>
          </Modal>
        )}

        <div id="dl-container" className="col-2-medium-3-small-3">
          <div className="w-max-xl">
            <div className={headClasses.join(' ')}>
              <span className="tracks-item-img"></span>
              <span className="title">Title</span>
              <span className="artist">Artist</span>
              <span className="album">Album</span>
              <span className="time">Time</span>
              <span className="tracks-item-menu btn">
                <i aria-hidden="true" className="icon icon-x" />
              </span>
            </div>
            <DraggableList
              items={playlist.tracks}
              component={PlaylistTrack}
              dragActive={isAuthor}
              canEdit={isAuthor}
              isPaused={isPaused}
              history={history}
              isActivePlaylist={isActivePlaylist}
              onPlayIndex={onPlayIndex}
              callbackMouseUp={this.handlerMoveItem}
              onDelete={this.handlerDeleteTrack}
              onPlay={this.handlerPlayTrack}
              scrollContainerName="main-content"
              containerId="dl-container"
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
  };
};

const mapDispatchToProps = dispatch => {
  return {
    getPlaylist: title => dispatch(get(`playlist/${title}`)),
    playTrack: item => dispatch(playOnPlaylist(item)),
    updatePlayingList: item => dispatch(updatePlaylistToPlay(item)),
    savePlaylist: (title, tracks) =>
      dispatch(put(`playlist/${title}`, { data: { tracks: tracks } })),
    deletePlaylist: title => dispatch(del(`playlist/${title}`)),
    activatePlaylist: item => dispatch(activatePlaylist(item)),
    onPauseFunc: () => dispatch(pauseState()),
    onPlayFunc: () => dispatch(playState())
  };
};

const QueueContainer = connect(mapStateToProps, mapDispatchToProps)(Queue);

export default QueueContainer;
