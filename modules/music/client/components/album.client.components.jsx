import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get, post } from 'core/client/services/core.api.services'
import { addAlbumToPlay, playOnAlbum, updateAlbumToPlay } from 'music/client/redux/actions'
import AlbumTrack from 'music/client/components/tracks/albumTrack.client.components'
import AddPlaylist from 'music/client/components/playList/addPlaylist.client.components'

import Modal from 'react-modal';
import ps from 'core/client/services/core.path.services'
import InfoPanel from './infoPanel/infoPanel.client.components'

import DraggableList from 'draggable/client/components/draggableList'

const emptyArray = [];

class Album extends Component {
  constructor (props) {
    super(props);

    this.state = {
      isActive: false,
      albumOfUrl: {
        pl: null,
        onPlayIndex: 0
      },
      modalIsOpen: false
    };

    this.handlerMoveItem = this.handlerMoveItem.bind(this);
    this.handlerReadTrack = this.handlerReadTrack.bind(this);
    this.handlerAddTrack = this.handlerAddTrack.bind(this);

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
            tracks: data.msg.tracks,
            item: data.msg,
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

    // @TODO play item system must be reworked. Now, data item from db is stored in albumOfUrl.pl.item

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
              tracks: data.msg.tracks,
              item: data.msg,
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
    const { isPaused, user, history, location } = this.props;
    const { onPlayIndex, pl } = albumOfUrl;

    return (
      <section className='pal grid-3 has-gutter'>
        { (pl && pl.item) &&
          <header>
            <InfoPanel album={pl.item} tracks={pl.tracks} location={location} history={history}/>

            {/*{@todo reimplemenb save as pl for album because
            it couldn't working know (moogose wants tracks like node
            and here is realy not a node)}*/}
            {/*{!! user &&*/}
            {/*<div className="album-list-save-cont">*/}
            {/*<button className='btn' onClick={this.openModal}>Save As Playlist</button>*/}

            {/*<Modal isOpen={this.state.modalIsOpen}*/}
            {/*onRequestClose={this.closeModal}*/}
            {/*className="modal"*/}
            {/*overlayClassName="modal-overlay"*/}
            {/*>*/}

            {/*<h2 className="modal-title">*/}
            {/*<i aria-hidden="true" className="icon icon-music icon-xl"/>*/}
            {/*{`Save ${pl.title} as playlist ?`}*/}
            {/*</h2>*/}

            {/*<div className="modal-content">*/}
            {/*<p>Type the playlist's title you want to create.</p>*/}
            {/*</div>*/}

            {/*<AddPlaylist*/}
            {/*history={history}*/}
            {/*placeholder={`${pl.title}'s playlist`}*/}
            {/*tracksId={pl.tracks}*/}
            {/*validation='Save'*/}
            {/*redirect*/}

            {/*/>*/}

            {/*</Modal>*/}
            {/*</div>*/}
            {/*}*/}

          </header>
        }
        {pl &&
          <div className='col-2-medium-3-small-3'>
            <div className='w-max-xl'>
              <div className={`move-album-tracks-items-row-header${!!user ? ' drag' : ''}`}>
                <span className='tracks-item-img'></span>
                <span className='title'>Title</span>
                <span className='artist'>Artist</span>
                <span className='time'>Time</span>
                <span className='tracks-item-menu'>Add</span>
              </div>
              <DraggableList
                items={pl.tracks}
                callbackMouseUp={this.handlerMoveItem}
                component={AlbumTrack}
                isActivePlaylist={isActive}
                dragActive={!!user}
                history={history}
                isPaused={isPaused}
                onPlayIndex={onPlayIndex}
                onPlay={this.handlerReadTrack}
                addTrack={this.handlerAddTrack}
              />
            </div>
          </div>
        }
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
      get(`album/tracks/${query}`)
    ),
    updateAlbumList: (item) => dispatch(
      updateAlbumToPlay(item)
    ),
    playTrackAlbum: (item) => dispatch(
      playOnAlbum(item)
    ),
    addPlaylistItems: (title, items) => dispatch(
      post(`playlist/${title}`, {
        data: items
      })
    ),
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
    if (array[i].path === path) return i;
  }
  return null;
}

export default AlbumContainer
