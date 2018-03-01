import React, { Component } from 'react'

import style from './style/controls.scss'

class Controls extends Component {
  shouldComponentUpdate (nextProps) {
    const { isPaused, pl, onPlay } = nextProps;
    return (isPaused !== this.props.isPaused || pl !== this.props.pl || onPlay !== this.props.onPlay);
  }

  render () {

    const { onPauseHandler, onPlayHandler, onPrevHandler, onNextHandler, onPlayIndex, pl, isPaused} = this.props;

    const playPauseBtn = () => {
      // If active playlist and on play, display Pause button.
      if (!isPaused) { return (
        <button onClick={onPauseHandler} className='btn-center'><span className='icon icon-pause'/></button>
      ); }
      // Else display Play button.
      else { return (
        <button onClick={onPlayHandler} className='btn-center'><span className='icon icon-play'/></button>
      ); }
    };

    const leftBtn = () => {
      if (pl) {
        const disabled = (onPlayIndex === 0);
        return (
          <button disabled={disabled} onClick={onPrevHandler} ><span className='icon icon-skip-back'/></button>
        );
      }
      return null;
    };

    const rightBtn = () => {
      if (pl) {
        const disabled = (onPlayIndex + 1 === pl.tracks.length);
        return (
          <button disabled={disabled} onClick={onNextHandler} ><span className='icon icon-skip-forward'/></button>
        );
      }
      return null;
    };

    return (
      <span className='ab-controls'>
        {leftBtn()}
        {playPauseBtn()}
        {rightBtn()}
      </span>
    );
  }
}

export default Controls
