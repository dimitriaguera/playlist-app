import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get, post } from 'core/client/services/core.api.services'
import { playOnPlaylist, playItem, pauseState, playState } from 'music/client/redux/actions'

class PlayingControls extends Component {
  constructor () {
    super();

    this.onPauseHandler = this.onPauseHandler.bind(this);
    this.onPlayHandler = this.onPlayHandler.bind(this);
    this.onNextHandler = this.onNextHandler.bind(this);
    this.onPrevHandler = this.onPrevHandler.bind(this);
  }

  onPlayHandler (e) {
    e.preventDefault();

    const _self = this;
    const pl = this.props.playlist;

    if (this.props.playingList.pl === pl) {
      this.props.play();
    }
    else {
      this.props.getPlaylist(pl.title)
        .then((data) => {
          if (data.success) {
            _self.props.onPlay({
              pl: data.msg,
              onPlayIndex: 0
            });
          }
        });
    }
  }

  onPauseHandler (e) {
    e.preventDefault();
    this.props.pause();
  }

  onNextHandler (e) {
    e.preventDefault();

    const { nextTracks, playingList, playlist } = this.props;
    const { onPlayIndex } = playingList;

    nextTracks({
      onPlayIndex: onPlayIndex + 1,
      pl: playlist
    });
  }

  onPrevHandler (e) {
    e.preventDefault();

    const { nextTracks, playingList, playlist } = this.props;
    const { onPlayIndex } = playingList;

    nextTracks({
      onPlayIndex: onPlayIndex - 1,
      pl: playlist
    });
  }

  render () {
    const { playingList, isPaused, playlist } = this.props;
    const { onPlayIndex, pl } = playingList;

    // Test if menu linked with active playlist.
    const isActive = pl && (pl.title === playlist.title);
    const disable = (!playlist.length);

    const playPauseBtn = () => {
      // If active playlist and on play, display Pause button.
      if (isActive && !isPaused) { return (
        <button className='btn btn-icon big' onClick={this.onPauseHandler} aria-label='pause'>
          <i aria-hidden='true' className='icon icon-pause' />
        </button>
      ); }
      // Else display Play button.
      else { return (
        <button disabled={disable} className='btn btn-icon big' aria-label='play' onClick={this.onPlayHandler}>
          <i aria-hidden='true' className='icon icon-play' />
        </button>
      ); }
    };

    const leftBtn = () => {
      if (isActive) {
        const disabled = (onPlayIndex === 0);
        return (
          <button disabled={disabled} className='btn btn-icon' aria-label='prev track' onClick={this.onPrevHandler}>
            <i aria-hidden='true' className='icon icon-play icon-skip-back' />
          </button>
        );
      }
      return null;
    };

    const rightBtn = () => {
      if (isActive) {
        const disabled = (onPlayIndex + 1 === playlist.length);
        return (
          <button disabled={disabled} className='btn btn-icon' aria-label='next track' onClick={this.onNextHandler}>
            <i aria-hidden='true' className='icon icon-play icon-skip-forward' />
          </button>
        );
      }
      return null;
    };

    return (
      <div className='menu-play'>
        {leftBtn()}
        {playPauseBtn()}
        {rightBtn()}
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    playingList: state.playlistStore.playingList,
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
    getPlaylist: (title) => dispatch(
      get(`playlist/${title}`)
    ),
    onPlay: (item) => dispatch(
      playOnPlaylist(item)
    ),
    nextTracks: (item) => dispatch(
      playOnPlaylist(item)
    )
  }
};

const PlayingControlsContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(PlayingControls);

export default PlayingControlsContainer
