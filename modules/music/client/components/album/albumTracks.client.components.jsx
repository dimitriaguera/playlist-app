import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Motion, spring } from 'react-motion'
import { post } from 'core/client/services/core.api.services'
import { playOnAlbum } from 'music/client/redux/actions'
import IconPlayAnim from 'music/client/components/iconPlayAnim/iconPlayAnim.client.components'
import AlbumInfo from './albumInfo.client.components'


class AlbumTracks extends Component {
  constructor (props) {
    super(props);

    this.state = {
      tracks: []
    };

    this.handlerPlayAlbum = this.handlerPlayAlbum.bind(this);
  }

  componentDidMount () {
    const _self = this;
    const { getAlbumTracks, renderTracksNow } = this.props;
    const delay = renderTracksNow ? 0 : 300;

    // Start fetching album tracks, with minimal delay before call setState.
    // This delay is needed to avoid lag during albumCard open anim.
    this.waitForAnimEnd(delay, getAlbumTracks, (err, data) => {
      if (!err) {
        _self.setState({tracks: data.tracks});
      }
    });
  }

  componentWillUnmount () {
    // Clear timer.
    clearTimeout(this.timeoutID);
  }

  waitForAnimEnd (delay, fn, callback) {
    let timeout = false;
    let close = null;

    // Catcher async result function.
    function proceed (err, data) {
      // If delay not ok, store callback with result.
      if (!timeout) {
        return close = () => {
          callback(err, data);
        }
      }
      // If delay ok, directly exec callback function.
      callback(err, data);
    }

    // Start async function with proceed as callback.
    fn(proceed);

    // Start timer.
    this.timeoutID = setTimeout(() => {
      timeout = true;
      // If async fn already called proceed,
      // call callback and result stored in close fn.
      // Else, nothing to do.
      if (close) {
        return close();
      }
    }, delay);
  }

  // Handler to add recursively all tracks on playlist.
  handlerPlayAlbum (e, i) {
    const {album, mode, onPlay, addAlbumToPlay} = this.props;

    // If this album already playing.
    if (mode === 'album' && onPlay.albumKey === album.key) {
      // Just store index track in playing queue.
      addAlbumToPlay({onPlayIndex: i});
    }

    // Else, play this album.
    else {
      // Build album data to store, and index to play.
      const albumToPlay = {
        pl: {
          title: album.name,
          key: album.key,
          tracks: this.state.tracks
        },
        onPlayIndex: i
      };
      // Store new playing album.
      addAlbumToPlay(albumToPlay);
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

  getStyle () {
    const {index, grid, card, tabHeight} = this.props;

    // Get Card position in his row.
    // Needed to know left style value, to position tab according tab position.
    const pos = index % grid.row;

    // Return style according to
    // Card default style,
    // and Card position in his row.
    return {
      width: ((grid.row * card.width) - (card.margin * 2)) + 'px',
      height: tabHeight + 'px',
      left: (-pos * card.width) + card.margin + 'px',
      top: card.height + 'px'
    }
  }

  render () {
    const { album, user, onPlay, onPlayIndex, cover, handlerPlayAlbum, handlerAddTracks } = this.props;
    const { tracks } = this.state;

    // Does this album is now playing ?
    const albumIsPlaying = onPlay.albumKey === album.key;

    // Get tab style.
    const style = this.getStyle();

    return (
      <div className='album-tracks' style={style}>
        {!!tracks.length &&
        <Motion defaultStyle={{o: 0, x: -20}} style={{o: spring(1), x: spring(0)}}>
          {({o, x}) =>
            <div className='album-tracks-container'
                 style={{
              WebkitTransform: `translate3d(${x}px, 0, 0)`,
              transform: `translate3d(${x}px, 0, 0)`,
              opacity: o
            }}>

              <div className='album-tracks-col'>
                <AlbumInfo album={album} albumIsPlaying={albumIsPlaying} handlerPlayAlbum={handlerPlayAlbum} handlerAddTracks={handlerAddTracks} />
              </div>

              <div className='album-tracks-col'>
                <div className='album-tracks-inner'>
                  <ul className='unstyled'>
                {tracks.map((item, i) => {
                  const trackIsPlaying = (albumIsPlaying && (onPlayIndex === i));
                  return (
                    <li key={i}>
                      <a className={trackIsPlaying ? 'album-tracks-item playing' : 'album-tracks-item'} title='Play track' onClick={(e) => this.handlerPlayAlbum(e, i)}>
                        {trackIsPlaying && <i className='white'><IconPlayAnim /></i>}
                        {!trackIsPlaying && <span aria-hidden='true' className='icon white icon-play' />}
                        <span className='album-tracks-title'>
                          {item.meta.trackno !== '0' && <span>{item.meta.trackno} - </span>}
                          {item.meta.title}
                        </span>
                        <span className='album-tracks-menu-inner'>
                          <button className='btn btn-icon' onClick={(e) => this.handlerAddTrack(e, item.tracksId)}>
                            <i aria-hidden='true' className='icon icon-plus'/>
                          </button>
                        </span>
                      </a>
                    </li>
                  )
                })}</ul>
                </div>
              </div>
            </div>}
        </Motion>}
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.authenticationStore._user,
    onPlay: state.playlistStore.onPlay,
    onPlayIndex: state.playlistStore.playingList.onPlayIndex,
    mode: state.playlistStore.mode,
    activePlaylist: state.playlistStore.activePlaylist
  }
};

const mapDispatchToProps = dispatch => {
  return {
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

const AlbumTracksContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AlbumTracks);


export default AlbumTracksContainer
