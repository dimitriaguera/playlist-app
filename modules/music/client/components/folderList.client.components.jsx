import React, {Component} from 'react'
import {connect} from 'react-redux'
import {get, put, post} from 'core/client/services/core.api.services'
import {
  addFolderToPlay,
  playOnFolder,
  updateFolderToPlay,
  pauseState,
  playState
} from 'music/client/redux/actions'
import FolderTrack from 'music/client/components/tracks/folderTrack.client.components'
import AddPlaylist from 'music/client/components/playList/addPlaylist.client.components'
import Modal from 'react-modal';
import ps from 'core/client/services/core.path.services'
import InfoPanelFolder from 'music/client/components/infoPanel/infoPanelFolder.client.components'

import DraggableList from 'draggable/client/components/draggableList'

class FolderList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isActive: false,
      albumOfUrl: {
        pl: null,
        onPlayIndex: 0
      },
      modalIsOpen: false
    };

    this.handlerAddTrack = this.handlerAddTrack.bind(this);
    this.handlerMoveItem = this.handlerMoveItem.bind(this);
    this.handlerPlayTrack = this.handlerPlayTrack.bind(this);

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  openModal() {
    this.setState({modalIsOpen: true});
  }

  closeModal() {
    this.setState({modalIsOpen: false});
  }

  componentDidMount () {
    // React Modal
    Modal.setAppElement("#root");
  }

  componentWillMount() {
    const _self = this;
    const {history, fetchFiles, playingList} = _self.props;

    // Build folder path from url path.
    let pathArray = ps.splitPath(ps.removeRoute(_self.props.location.pathname, _self.props.match.path));
    let path = ps.buildPath(pathArray);

    // Test if album is already playing.
    // If album playing, mount data from store.
    if (playingList.pl && playingList.pl.path === path) {
      _self.setState({
        isActive: true,
        albumOfUrl: playingList
      })
    }
    // Else, query data from DB.
    else {
      fetchFiles(ps.urlEncode(path))
        .then((data) => {
          if (!data.success) {
            return history.push('/not-found');
          }

          const album = {
            title: pathArray[pathArray.length - 1],
            path: path,
            tracks: data.msg
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

  componentWillReceiveProps(nextProps) {
    const _self = this;
    const {playingList, fetchFiles, history} = nextProps;
    const {albumOfUrl} = this.state;

    // Force re-rendering on props location change.
    if (_self.props.location.pathname !== nextProps.location.pathname) {
      // Test if album is already playing.
      // Get and clean path.
      let pathArray = ps.splitPath(ps.removeRoute(_self.props.location.pathname, _self.props.match.path));
      let path = ps.buildPath(pathArray);

      // If album playing, mount data from store.
      if (playingList.pl && playingList.pl.path === path) {
        return _self.setState({
          isActive: true,
          albumOfUrl: playingList
        })
      }
      // Else, query data from DB.
      else {
        return fetchFiles(ps.urlEncode(path))
          .then((data) => {
            if (!data.success) {
              return history.push('/not-found');
            }

            const album = {
              title: pathArray[pathArray.length - 1],
              path: path,
              tracks: data.msg
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
      const isActive = (playingList.pl && playingList.pl.path === albumOfUrl.pl.path);

      // If same album, copy changes in local state, and set isActive to true.
      this.setState({
        isActive: isActive,
        albumOfUrl: playingList,
        onPlayIndex: nextProps.onPlayIndex
      });
    }
  }

  handlerPlayTrack(e, key) {

    const { isPaused, onPlay, onPauseFunc, onPlayFunc } = this.props;
    const {albumOfUrl} = this.state;
    const {pl} = albumOfUrl;

    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (pl.tracks[key]._id === onPlay._id) {
      if (isPaused) {
        return onPlayFunc();
      } else {
        return onPauseFunc();
      }
    }

    this.props.playTrack({
      pl: pl,
      onPlayIndex: key
    });
  }

  handlerAddTrack (e, tracksId) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const { addPlaylistItems, activePlaylist, user, history, location } = this.props;

    // User must be connected to add tracks.
    if (!user) return history.push({pathname: '/login', state: {from: location.pathname }});

    // Add tracks into activated Playlist.
    if (activePlaylist && tracksId) addPlaylistItems(activePlaylist.title, {tracks: [tracksId]});
  }

  handlerMoveItem(prevItems, nextItems) {
    const {albumOfUrl} = this.state;
    const {playingList} = this.props;

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
    if (playingList.pl && playingList.pl.path === albumOfUrl.pl.path) {
      // Store updated album.
      return this.props.updateAlbumList(data);
    }

    // If this album isn'ot playing, just update local state.
    this.setState({
      albumOfUrl: data
    });
  }

  render() {
    const {albumOfUrl, isActive} = this.state;
    const {isPaused, user, history, location} = this.props;
    const {onPlayIndex, pl} = albumOfUrl;

    if (!pl) return null;

    const headClasses = ['move-folder-tracks-items-row-header drag'];
    if( !!user ) headClasses.push('edit');

    return (
      <section className="pal grid-3 has-gutter">
        <header className='col-1-medium-3-small-3'>
          {!!user &&
            <div className="pl-action-cont mbm">
              <button className='btn btn-standard' onClick={this.openModal}>Save As Playlist</button>
              <Modal isOpen={this.state.modalIsOpen}
                     onRequestClose={this.closeModal}
                     className="modal"
                     overlayClassName="modal-overlay"
              >
              <h2 className="modal-title">
                <i aria-hidden="true" className="icon icon-music icon-xl"/>
                {`Save ${pl.title} as playlist ?`}
              </h2>
              <div className="modal-content">
                <p>Type the playlist's title you want to create.</p>
              </div>
              <AddPlaylist
                history={history}
                placeholder={`${pl.title}'s playlist`}
                tracksId={pl.tracks}
                validation='Save'
                redirect
              />
            </Modal>
          </div>
          }
        <InfoPanelFolder item={pl} history={history} location={location} />
      </header>
      <div id='dl-container' className='col-2-medium-3-small-3'>
        <div className='w-max-xl'>
          <div className={headClasses.join(' ')}>
            <span className='tracks-item-img'></span>
            <span className='title'>Title</span>
            <span className='artist'>Artist</span>
            <span className='album'>Album</span>
            <span className='time'>Time</span>
            <span className='tracks-item-menu'>Add</span>
          </div>
          <DraggableList
            items={pl.tracks}
            callbackMouseUp={this.handlerMoveItem}
            component={FolderTrack}
            scrollContainerName='main-content'
            containerId='dl-container'
            isActivePlaylist={isActive}
            user={user}
            history={history}
            isPaused={isPaused}
            onPlayIndex={onPlayIndex}
            onPlay={this.handlerPlayTrack}
            addTrack={this.handlerAddTrack}
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
    isAuthenticated: state.authenticationStore.isAuthenticated,
    activePlaylist: state.playlistStore.activePlaylist,
    user: state.authenticationStore._user
  }
};

const mapDispatchToProps = dispatch => {
  return {
    fetchFiles: (query) => dispatch(
      get(`nodes/q/files?path=${query || ''}`)
    ),
    updateAlbumList: (item) => dispatch(
      updateFolderToPlay(item)
    ),
    playTrack: (item) => dispatch(
      playOnFolder(item)
    ),
    addPlaylistItems: (title, items) => dispatch(
      post(`playlist/${title}`, {
        data: items
      })
    ),
    onPauseFunc: () => dispatch(
      pauseState()
    ),
    onPlayFunc: () => dispatch(
      playState()
    )
  }
};

const FolderListContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(FolderList);


// HELPER
function getTrackIndexBySrc(path, array) {
  let l = array.length;
  for (let i = 0; i < l; i++) {
    if (array[i].path == path) return i;
  }
  return null;
}

export default FolderListContainer
