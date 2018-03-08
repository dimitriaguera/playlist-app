import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get, put } from 'core/client/services/core.api.services'
import { addAlbumToPlay, playOnAlbum, updateAlbumToPlay } from 'music/client/redux/actions'
import Tracks from 'music/client/components/tracks/tracks.client.components'
import AddPlaylist from 'music/client/components/playList/addPlaylist.client.components'
import { Divider, Label, Button, Modal, Header } from 'semantic-ui-react'
import ps from 'core/client/services/core.path.services'
import InfoPanel from './infoPanel/infoPanel.client.components'

import DraggableList from 'draggable/client/components/draggableList'

class Album extends Component {
  constructor (props) {
    super(props);

    this.state = {
      isActive: false,
      albumOfUrl: {
        pl: null,
        onPlayIndex: 0
      }
    };

    this.handlerMoveItem = this.handlerMoveItem.bind(this);
    this.handlerReadTrack = this.handlerReadTrack.bind(this);
  }

  componentWillMount () {
    const _self = this;
    const { history, fetchFiles, playingList } = _self.props;

    // Build folder path from url path.
    const key = ps.removeFirstSeparator(ps.removeRoute(_self.props.location.pathname, _self.props.match.path));

    console.log(key);

    // Test if album is already playing.
    // If album playing, mount data from store.
    if (playingList.pl && playingList.pl.key === key) {
      console.log('PL DETECTE');
      _self.setState({
        isActive: true,
        albumOfUrl: playingList
      })
    }
    // Else, query data from DB.
    else {
      console.log('PAS PL');
      fetchFiles(ps.urlEncode(key))
        .then((data) => {
          if (!data.success) {
            return history.push('/not-found');
          }
          console.log(data);
          const album = {
            title: data.msg.name,
            key: key,
            tracks: data.msg.tracks
          };

          _self.setState({
            isActive: false,
            albumOfUrl: {
              pl: album,
              onPlayIndex: 0
            }
          })
        });
    }
  }

  componentWillReceiveProps (nextProps) {
    const _self = this;
    const { playingList, fetchFiles, history } = nextProps;
    const { albumOfUrl } = this.state;

    // Force re-rendering on props location change.
    if (_self.props.location.pathname !== nextProps.location.pathname) {
      // Test if album is already playing.
      // Get and clean path.
      const oldKey = ps.removeFirstSeparator(ps.removeRoute(_self.props.location.pathname, _self.props.match.path));

      // If album playing, mount data from store.
      if (playingList.pl && playingList.pl.key === oldKey) {
        return _self.setState({
          isActive: true,
          albumOfUrl: playingList
        })
      }
      // Else, query data from DB.
      else {
        return fetchFiles(ps.urlEncode(playingList.pl.key))
          .then((data) => {
            if (!data.success) {
              return history.push('/not-found');
            }

            const album = {
              title: data.msg.name,
              key: playingList.pl.key,
              tracks: data.msg.tracks
            };

            _self.setState({
              isActive: false,
              albumOfUrl: {
                pl: album,
                onPlayIndex: 0
              }
            })
          });
      }
    }

    // Else. Props albumList comes from store, and isn't empty if album playing.
    if (playingList !== this.props.playingList) {
      // So checking if store's albumList is already current album in component's state.
      const isActive = (playingList.pl && playingList.pl.key === albumOfUrl.pl.key);

      // If same album, copy changes in local state, and set isActive to true.
      this.setState({
        isActive: isActive,
        albumOfUrl: playingList,
        onPlayIndex: nextProps.onPlayIndex
      });
    }
  }

  handlerReadTrack (key) {
    return (e) => {
      const { albumOfUrl } = this.state;
      const { pl } = albumOfUrl;

      this.props.playTrackAlbum({
        pl: pl,
        onPlayIndex: key
      });
      e.preventDefault();
    }
  }

  handlerMoveItem (prevItems, nextItems) {
    const { albumOfUrl } = this.state;
    const { playingList } = this.props;

    const oldTracks = prevItems;
    const newTracks = nextItems;

    let newIndex = albumOfUrl.onPlayIndex;

    // // If item playing moved, get his index.
    if (oldTracks[newIndex].path !== newTracks[newIndex].path) {
      newIndex = getTrackIndexBySrc(oldTracks[newIndex].path, newTracks);
    }

    // Build album object.
    const data = {
      pl: Object.assign({}, albumOfUrl.pl, {tracks: nextItems}),
      onPlayIndex: newIndex
    };

    // Need to determine if changes must update playing album in state store,
    // or just update component state.
    // If this album mounted on component state is now playing, update via redux store.
    if (playingList.pl && playingList.pl.key === albumOfUrl.pl.key) {
      // Store updated album.
      return this.props.updateAlbumList(data);
    }

    // If this album isn'ot playing, just update local state.
    this.setState({
      albumOfUrl: data
    });
  }

  render () {
    const { albumOfUrl, isActive } = this.state;
    const { isPaused, user, history } = this.props;
    const { onPlayIndex, pl } = albumOfUrl;

    return (
      <section className='pal'>{ pl &&

      <div>
        <Label color='teal' style={{textTransform: 'uppercase'}}>Album</Label>
        <InfoPanel item={pl}
        />

        {!! user &&
        <Modal trigger={
          <Button icon basic inverted>
                            Save As Playlist
          </Button>
        } basic size='small' closeIcon>
          <Header icon='sound' content={`Save ${pl.title} as playlist ?`} />
          <Modal.Content>
            <p>Type the playlist's title you want to create.</p>
            <AddPlaylist
              history={history}
              placeholder={`${pl.title}'s playlist`}
              tracksId={pl.tracks.map(t => t.tracksId)}
              validation='Save'
              redirect
            />
          </Modal.Content>
        </Modal>}

        <Divider />

        <DraggableList
          items={pl.tracks}
          callbackMouseUp={this.handlerMoveItem}
          component={Tracks}
          isActivePlaylist={isActive}
          user={user}
          isPaused={isPaused}
          onPlayIndex={onPlayIndex}
          onPlay={this.handlerReadTrack}
        />
      </div>
      }</section>
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
    fetchFiles: (query) => dispatch(
      get(`album/tracks/${query}`)
    ),
    updateAlbumList: (item) => dispatch(
      updateAlbumToPlay(item)
    ),
    playTrackAlbum: (item) => dispatch(
      playOnAlbum(item)
    )
  }
};

const AlbumContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Album);


// HELPER
function getTrackIndexBySrc (path, array) {
  let l = array.length;
  for (let i = 0; i < l; i++) {
    if (array[i].path == path) return i;
  }
  return null;
}

export default AlbumContainer
