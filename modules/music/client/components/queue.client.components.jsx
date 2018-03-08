import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get, put, del } from 'core/client/services/core.api.services'
import { playOnPlaylist, updatePlaylistToPlay } from 'music/client/redux/actions'
import { mustUpdate } from 'music/client/helpers/music.client.helpers'
import socketServices from 'core/client/services/core.socket.services'
import Tracks from './tracks/tracks.client.components'
import AddPlaylist from 'music/client/components/playList/addPlaylist.client.components'
import { Divider, Label, Button, Modal, Header, Checkbox } from 'semantic-ui-react'

import DraggableList from 'draggable/client/components/draggableList'

class Queue extends Component {
  constructor (props) {
    super(props);

    this.handleCheckChange = this.handleCheckChange.bind(this);
    this.handlerSavePlaylist = this.handlerSavePlaylist.bind(this);
    this.handlerClearPlaylist = this.handlerClearPlaylist.bind(this);
    this.handlerReadFile = this.handlerReadFile.bind(this);
    this.handlerDeleteTrack = this.handlerDeleteTrack.bind(this);
    this.handlerMoveItem = this.handlerMoveItem.bind(this);

    this.socket = socketServices.getPublicSocket();
    this.state = {
      clearAfterSave: false,
      playlist: {
        title: '',
        tracks: []
      }
    }
  }

  componentWillMount () {
    const _self = this;
    const { history, user } = _self.props;

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
  handleCheckChange (e, data) {
    const value = data.checked;
    const name = data.name;

    this.setState({[name]: value});
  }

  // Play a track in queue.
  handlerReadFile (key) {
    const { playlist } = this.state;

    return (e) => {
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

  render () {
    const { playlist } = this.state;
    const { playingList, isPaused, isAuthenticated, user, history } = this.props;
    const { onPlayIndex, pl } = playingList;
    const isActivePlaylist = mustUpdate(pl, playlist);

    return (
      <section className='pal'>
        <Label color='teal' style={{textTransform: 'uppercase'}}>Queue</Label>
        <h1>{user.username}</h1>


        <div className='queue-menu'>
          {/* Save as playlist displayed only for Queue. */}
          {!!playlist.tracks.length &&
          <Modal trigger={
            <Button onClick={() => this.handlerSaveAsPlaylist} icon basic inverted>
                                Save As Playlist
            </Button>
          } basic size='small' closeIcon>
            <Header icon='sound' content={`Save current queue as playlist ?`} />
            <Modal.Content>
              <p>Type the playlist's title you want to create.</p>
              <AddPlaylist
                history={history}
                tracksId={playlist.tracks}
                validation='Save'
                redirect
                onSave={this.handlerSavePlaylist}
              />
            </Modal.Content>
            <Modal.Actions><Checkbox name='clearAfterSave' label='Clear queue after save.'
              onChange={this.handleCheckChange} /></Modal.Actions>
          </Modal>
          }
          {/* Add tracks button. */}
          <Button onClick={() => history.push(`/music?pl=${playlist.title}`)} icon basic inverted>
                        Add tracks
          </Button>

          {/* Clear all tracks button. */}
          <Button onClick={this.handlerClearPlaylist} icon basic inverted>
                        Clear all
          </Button>
        </div>

        <Divider />

        <DraggableList
          items={playlist.tracks}
          dragActive={isAuthenticated}
          callbackMouseUp={this.handlerMoveItem}
          component={Tracks}
          user={user}
          isPaused={isPaused}
          isActivePlaylist={isActivePlaylist}
          onPlayIndex={onPlayIndex}
          onDelete={this.handlerDeleteTrack}
          onPlay={this.handlerReadFile}
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
    )
  }
};

const QueueContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Queue);

export default QueueContainer
