import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get, post } from 'core/client/services/core.api.services'
import { playOnAlbum } from 'music/client/redux/actions'
import ps from 'core/client/services/core.path.services'
import Img from 'music/client/components/image.client.components'
import AlbumTracks from 'music/client/components/albumTracks.client.components'
import IconPlayAnim from 'music/client/components/iconPlayAnim/iconPlayAnim.client.components'
import { Icon } from 'semantic-ui-react'


import style from './style/albumCard.scss'

class AlbumCard extends Component {
  constructor (props) {
    super(props);

    this.handlerOpenTab = this.handlerOpenTab.bind(this);
    this.handlerCloseTab = this.handlerCloseTab.bind(this);
    this.handlerPlayAlbum = this.handlerPlayAlbum.bind(this);
    this.handlerAddTracks = this.handlerAddTracks.bind(this);
    this.getAlbumTracks = this.getAlbumTracks.bind(this);

    this.state = {
      playing: false,
      openTab: false,
      row: null,
      renderTracksNow: false,
      style: this.props.wrapperStyle
    };
  }

  shouldComponentUpdate (nextProps, nextState) {
    // Update component if tab open/close
    // or if grid params change.
    return (
      nextState.openTab !== this.state.openTab ||
            nextProps.grid !== this.props.grid
    );
  }

  componentWillReceiveProps (nextProps) {
    // Check if album playing change, class 'playing' are add/remove directly on DOM element with classList method.
    // This is to avoid render calculate or shouldComponentUpdate evaluation
    // on hundreds of albums when album playing just change.
    if (this.props.playingAlbumKey === this.props.album.key && nextProps.playingAlbumKey !== this.props.album.key) {
      this.domElmt.classList.remove('playing');
    }
    else if (this.props.album.key === nextProps.playingAlbumKey) {
      this.domElmt.classList.add('playing');
    }
  }

  getRowNumber () {
    // Return albumCard's row number.
    return Math.ceil((this.props.index + 1) / this.props.grid.row);
  }

  getAlbumTracks (callback) {
    const { search, album } = this.props;

    // Start fetching album tracks.
    return search(`tracks?fi=albumKey&sort=meta.trackno&q=${album.key}&exact=true`)
      .then((data) => {
        // If error, stop process.
        if (!data.success) {
          return callback(data);
        }
        // No-mutate album.
        const albumWithTracks = Object.assign({}, album);
        // Add tracks.
        albumWithTracks.tracks = data.msg.hits.hits.map((item) => item._source);
        // Call callback.
        callback(null, albumWithTracks);
      });
  }

  handlerOpenTab () {
    const { openTab, style } = this.state;
    const { hookOpenTab, hookCloseTab, card } = this.props;

    // If tab already open, close it.
    if (openTab) {
      return hookCloseTab();
    }

    // Get row number of this card.
    const row = this.getRowNumber();

    // Register method to close this tab,
    // close last tab opened,
    // and check if new tab is in same row.
    const sameRow = hookOpenTab(this.handlerCloseTab, row);

    // Open tab, store row number,
    // skip in mind if tracks have to be rendered now in tabs,
    // define style to apply.
    this.setState({
      openTab: true,
      row: row,
      renderTracksNow: sameRow,
      style: Object.assign({}, style, {
        marginBottom: card.tabHeight + card.margin + 'px',
        transition: sameRow ? '' : 'margin 0.3s'
      })
    });
  }

  handlerCloseTab () {
    const { style } = this.state;
    // Close tab, define style to apply.
    this.setState({
      openTab: false,
      style: Object.assign({}, style, {marginBottom: '0', transition: 'margin 0.3s'})
    });
  }

  handlerPlayAlbum (e, i) {
    const { addAlbumToPlay } = this.props;

    // Get album populated with tracks.
    this.getAlbumTracks((err, album) => {
      if (!err) {
        // Build data to store as playing album.
        const data = {
          onPlayIndex: i || 0,
          pl: {
            title: album.name,
            key: album.key,
            tracks: album.tracks
          }
        };
        // Store playing album.
        addAlbumToPlay(data);
      }
    });
  }

  handlerAddTracks (e) {
    const { addPlaylistItems, activePlaylist, user } = this.props;

    // User must be connected to add tracks.
    if (!user) return history.push('/login');

    // Get album populated with tracks.
    this.getAlbumTracks((err, album) => {
      if (!err) {
        // Extract tracks id from album.
        const tracksID = album.tracks.map(t => t.tracksId);
        // Add tracks into activated Playlist.
        addPlaylistItems(activePlaylist.title, {tracks: tracksID});
      }
    });
    if (e) e.stopPropagation();
  }

  render () {
    const { openTab, style, renderTracksNow } = this.state;
    const { grid, card, index, imageStyle, innerStyle, album, playingAlbumKey } = this.props;

    // Build cover path from album key.
    const cover = ps.changeSeparator(album.key, '___', '/');

    // Start build classes.
    const classes = ['albums-item-album'];

    // Tab tracks open or not.
    if (openTab) {
      classes.push('open');
    }

    // For the first render, check if album is playing.
    // Next, if album playing change, class 'playing' are add/remove directly on DOM element with classList method.
    // This is to avoid render calculate or shouldComponentUpdate evaluation
    // on hundreds of albums when album playing just change.
    if (playingAlbumKey === album.key) {
      classes.push('playing');
    }

    console.log('RENDER CARD');

    return (
      <div ref={r => this.domElmt = r} style={style} className={classes.join(' ')}>

        <div className={`albums-item-img`} style={innerStyle} onClick={this.handlerPlayAlbum}>
          <Img title={`${album.name} cover`}
            src={'pictures/' + cover + '/cover.jpg'}
            defaultSrc='static/images/default_cover.png'
            style={imageStyle}
          />
          <IconPlayAnim wrapperStyle={{width: '100%', height: '100%'}} />
          <span aria-hidden='true' className='icon icon-l white icon-play' />
          <span aria-hidden='true' className='icon icon-l white icon-plus' onClick={this.handlerAddTracks} />
        </div>

        <div className='albums-item-info' onClick={this.handlerOpenTab}>
          <div className='name'>{album.name}</div>
          <div className='date'>{album.year}</div>
          <div className='artist'><span>{album.artist}</span></div>
        </div>

        {openTab &&
        <AlbumTracks album={album}
          index={index}
          card={card}
          grid={grid}
          renderTracksNow={renderTracksNow}
          getAlbumTracks={this.getAlbumTracks}
        />
        }

      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.authenticationStore._user,
    activePlaylist: state.playlistStore.activePlaylist,
    playingAlbumKey: state.playlistStore.onPlay.albumKey
  }
};

const mapDispatchToProps = dispatch => {
  return {
    search: (query) => dispatch(
      get(`search/${query}`)
    ),
    addAlbumToPlay: (item) => {
      // Search first track on list.
      const track = item.pl.tracks[0];
      // Add album to store.
      dispatch(playOnAlbum(item));
    },
    addPlaylistItems: (title, items) => dispatch(
      post(`playlist/${title}`, {
        data: items
      })
    )
  }
};

const AlbumCardContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AlbumCard);


export default AlbumCardContainer
