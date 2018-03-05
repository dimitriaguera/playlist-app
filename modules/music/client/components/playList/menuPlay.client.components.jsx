import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get, post } from 'core/client/services/core.api.services'
import { playOnPlaylist, playItem, pauseState, playState } from 'music/client/redux/actions'
import { Menu } from 'semantic-ui-react'


class PlayingControls extends Component {
  constructor () {
    super();

    this.onPauseHandler = this.onPauseHandler.bind(this);
    this.onPlayHandler = this.onPlayHandler.bind(this);
    this.onNextHandler = this.onNextHandler.bind(this);
    this.onPrevHandler = this.onPrevHandler.bind(this);
  }

  onPlayHandler (e) {
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
    this.props.pause();
  }

  onNextHandler (e) {
    const { nextTracks, playingList, playlist } = this.props;
    const { onPlayIndex } = playingList;

    nextTracks({
      onPlayIndex: onPlayIndex + 1,
      pl: playlist
    });
  }

  onPrevHandler (e) {
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
        <Menu.Item onClick={this.onPauseHandler}>
          <i aria-hidden="true" className="icon icon-pause icon-disable" />
        </Menu.Item>
      ); }
      // Else display Play button.
      else { return (
        <Menu.Item disabled={disable} onClick={this.onPlayHandler}>
          <i aria-hidden="true" className="icon icon-play icon-disable" />
        </Menu.Item>
      ); }
    };

    const leftBtn = () => {
      if (isActive) {
        const disabled = (onPlayIndex === 0);
        return (
          <Menu.Item disabled={disabled} onClick={this.onPrevHandler}>
            <i aria-hidden="true" className="icon icon-play icon-chevron-left" />
          </Menu.Item>
        );
      }
      return null;
    };

    const rightBtn = () => {
      if (isActive) {
        const disabled = (onPlayIndex + 1 === playlist.length);
        return (
          <Menu.Item disabled={disabled} onClick={this.onNextHandler}>
            <i aria-hidden="true" className="icon icon-play icon-chevron-right" />
          </Menu.Item>
        );
      }
      return null;
    };

    return (
      <Menu color='blue' secondary inverted={isActive}>
        {leftBtn()}
        {playPauseBtn()}
        {rightBtn()}
      </Menu>
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