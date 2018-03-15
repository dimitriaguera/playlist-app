import React, { Component } from 'react'

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
        <button aria-label="Pause" onClick={onPauseHandler} className='btn btn-center'><i aria-hidden="true" className='icon icon-pause'/></button>
      ); }
      // Else display Play button.
      else { return (
        <button aria-label="Play" onClick={onPlayHandler} className='btn btn-center'><i aria-hidden="true" className='icon icon-play'/></button>
      ); }
    };

    const leftBtn = () => {
      if (pl) {
        const disabled = (onPlayIndex === 0);
        return (
          <button aria-label="Previous" disabled={disabled} className='btn' onClick={onPrevHandler} ><i aria-hidden="true" className='icon icon-skip-back'/></button>
        );
      }
      return (<button aria-label="Previous" disabled="true" className='btn'><i aria-hidden="true" className='icon icon-skip-back'/></button>);
    };

    const rightBtn = () => {
      if (pl) {
        const disabled = (onPlayIndex + 1 === pl.tracks.length);
        return (
          <button aria-label="Next" disabled={disabled} className='btn' onClick={onNextHandler} ><i aria-hidden="true" className='icon icon-skip-forward'/></button>
        );
      }
      return (<button aria-label="Next" disabled="true" className='btn'><i aria-hidden="true" className='icon icon-skip-forward'/></button>);
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
