import React, { Component } from 'react'
import ps from 'core/client/services/core.path.services'
import config from 'env/config.client'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { get, post } from 'core/client/services/core.api.services'
import { playOnPlaylist, playOnAlbum, playOnFolder, playItem, pauseState, playState, updatePlaylistToPlay } from 'music/client/redux/actions'
import { Label, Icon, Popup } from 'semantic-ui-react'
import ReactAudioPlayer from 'react-audio-player'
import Img from 'music/client/components/image.client.components'
import Controls from './controls.client.components'
import RangeSlider from './range.client.components'
import MetaInfo from './meta.client.components'
import Bread from './bread.client.components'
import RangeVolume from './volume.client.components'
import { MetaNameNextTracks, MetaNamePrevTracks } from './next.client.components'


import style from './style/audioBar.scss'

class AudioBar extends Component {
  constructor (props) {
    super(props);

    this.onEndedHandler = this.onEndedHandler.bind(this);
    this.onPauseHandler = this.onPauseHandler.bind(this);
    this.onPlayHandler = this.onPlayHandler.bind(this);
    this.onCanPlayHandler = this.onCanPlayHandler.bind(this);
    this.onNextHandler = this.onNextHandler.bind(this);
    this.onPrevHandler = this.onPrevHandler.bind(this);

    this.state = {
      audioReady: false
    }
  }

  /**
     * Switch to next Track on current playing track ends.
     * @param e
     */

  onEndedHandler (e) {
    const { nextTracks, pl, onPlayIndex, mode } = this.props;
    const callback = getActiveMode(mode);

    // Test if playlist or album context.
    if (pl !== null) {
      // Test if not the last track.
      if (onPlayIndex + 1 === pl.tracks.length) return;
      nextTracks({
        onPlayIndex: onPlayIndex + 1,
        pl: pl
      }, callback);
    }
  }

  // When first tracks ready to play, fire ready to true.
  // This allows range slider element to render.
  onCanPlayHandler (e) {
    if (!this.state.audioReady) {
      this.setState({audioReady: true});
    }
  }

  // If app state is play, apply play() method to audio element.
  // Permit remote pause/play trough redux state changes on all app.
  onPlayHandler (e) {
    this.props.play();
  }

  // If app state is pause, apply pause() method to audio element.
  // Permit remote pause/play trough redux state changes on all app.
  onPauseHandler (e) {
    this.props.pause();
  }

  // Play next tracks on album/playlist list.
  onNextHandler (e) {
    const { pl, onPlayIndex, mode } = this.props;
    const callback = getActiveMode(mode);

    this.props.nextTracks({
      onPlayIndex: onPlayIndex + 1,
      pl: pl
    }, callback);
  }

  // Play previous tracks on album/playlist list.
  onPrevHandler (e) {
    const { pl, onPlayIndex, mode } = this.props;
    const callback = getActiveMode(mode);

    this.props.nextTracks({
      onPlayIndex: onPlayIndex - 1,
      pl: pl
    }, callback);
  }

  render () {
    const { onPlay, isPaused, pl, onPlayIndex, mode } = this.props;
    const { audioReady } = this.state;

    let audioEl = null;

    if (this.rap && this.rap.audioEl) {
      audioEl = this.rap.audioEl;
      isPaused ? audioEl.pause() : audioEl.play();
    }

    const classes = ['audioBar'];

    const cover = onPlay.albumKey ? ps.changeSeparator(onPlay.albumKey, '___', '/') : null;

    return (
      !!onPlay.path &&
      <div style={{width: '100%', position: 'fixed', bottom: '0'}} className={classes.join(' ')}>

        <ReactAudioPlayer preload='auto' autoPlay
          onEnded={this.onEndedHandler}
          onCanPlay={this.onCanPlayHandler}
          ref={(element) => { this.rap = element; }}
          src={`/api/music/read?path=${ps.urlEncode(onPlay.path)}`}
        />

        <div className='audioBar-wrapper'>

          <div className='audioBar-coll audioBar-img'>
            <Img title={`${onPlay.publicName} cover`}
                 src={'pictures/' + cover + '/cover.jpg'}
                 defaultSrc='static/images/default_cover.png'
            />
          </div>

          <MetaInfo pl={pl} onPlayIndex={onPlayIndex} mode={mode} onPlay={onPlay}/>

          <div className='audioBar-coll audioBar-control'>
              <Controls onPauseHandler={this.onPauseHandler}
                onPlayHandler={this.onPlayHandler}
                onPrevHandler={this.onPrevHandler}
                onNextHandler={this.onNextHandler}
                onPlayIndex={onPlayIndex}
                isPaused={isPaused}
                onPlay={onPlay}
                pl={pl}
              />
          </div>
          <div className='audioBar-coll audioBar-range'>
              <Bread onPlay={onPlay} />
              {audioReady && <RangeSlider audioEl={audioEl} />}
              {/*<MetaNamePrevTracks pl={pl} onPlayIndex={onPlayIndex} />*/}
              {/*<MetaNameNextTracks pl={pl} onPlayIndex={onPlayIndex} />*/}
              {/*{audioReady && <RangeVolume audioEl={audioEl} />}*/}
          </div>

          <div className='audioBar-coll audioBar-menu'>
            menu
          </div>

        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    onPlay: state.playlistStore.onPlay,
    mode: state.playlistStore.mode,
    pl: state.playlistStore.playingList.pl,
    onPlayIndex: state.playlistStore.playingList.onPlayIndex,
    activePlaylist: state.playlistStore.activePlaylist,
    isPaused: state.playlistStore.pause
  }
};

const mapDispatchToProps = dispatch => {
  return {
    pause: () => dispatch(
      pauseState()
    ),
    play: () => dispatch(
      playState()
    ),
    nextTracks: (item, callback) => dispatch(
      callback(item)
    ),
    updatePlayingList: (item) => dispatch(
      updatePlaylistToPlay(item)
    )
  }
};

const AudioBarContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AudioBar);

// HELPER
function getActiveMode (mode) {
  let callback = null;

  switch (mode) {
    case 'playlist':
      callback = playOnPlaylist;
      break;

    case 'folder':
      callback = playOnFolder;
      break;

    case 'album':
      callback = playOnAlbum;
      break;

    default:
      callback = playOnPlaylist;
      break;
  }
  return callback;
}

export default AudioBarContainer
