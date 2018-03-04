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
        <button onClick={onPauseHandler} className='btn btn-center'><i aria-hidden="true" className='icon icon-l icon-pause'/></button>
      ); }
      // Else display Play button.
      else { return (
        <button onClick={onPlayHandler} className='btn btn-center'><i aria-hidden="true" className='icon icon-l icon-play'/></button>
      ); }
    };

    const leftBtn = () => {
      if (pl) {
        const disabled = (onPlayIndex === 0);
        return (
          <button disabled={disabled} className='btn' onClick={onPrevHandler} ><i aria-hidden="true" className='icon icon-l icon-skip-back'/></button>
        );
      }
      return null;
    };

    const rightBtn = () => {
      if (pl) {
        const disabled = (onPlayIndex + 1 === pl.tracks.length);
        return (
          <button disabled={disabled} className='btn' onClick={onNextHandler} ><i aria-hidden="true" className='icon icon-l icon-skip-forward'/></button>
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
