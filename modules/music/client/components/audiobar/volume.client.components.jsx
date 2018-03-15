import React, { Component } from 'react'

class RangeVolume extends Component {
  constructor () {
    super();

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleVolClick = this.handleVolClick.bind(this);

    this.state = {
      position: 0,
      elementX: 0,
      elementW: 0,
      volume: 0,
      isPressed: false
    };
  }

  componentDidMount () {
    const { audioEl } = this.props;

    // Get volume and init volumeBar
    audioEl.volume = 0.5;

    this.setState(
      {
        volume: audioEl.volume,
        position: audioEl.volume * 100
      }
    );

    // Apply windows touch/mouse control listeners.
    //@todo why ?
    window.addEventListener('touchmove', this.handleTouchMove);
    window.addEventListener('touchend', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  componentWillUnmount () {
    // Clear listeners.
    //@todo why ?
    window.removeEventListener('touchmove', this.handleTouchMove, false);
    window.removeEventListener('touchend', this.handleMouseUp, false);
    window.removeEventListener('mousemove', this.handleMouseMove, false);
    window.removeEventListener('mouseup', this.handleMouseUp, false);
  }

  // Touch start handler.
  handleTouchStart (e) {
    this.handleMouseDown(e.touches[0]);
  }

  // Touch move handler.
  handleTouchMove (e) {
    e.preventDefault();
    this.handleMouseMove(e.touches[0]);
  }

  // Handler mouse down.
  handleMouseDown ({ pageX }) {
    const box = this.bar.getBoundingClientRect();
    const elementX = box.left;
    const elementW = box.width;

    this.setState({
      elementX: elementX,
      elementW: elementW,
      position: ((pageX - elementX) / elementW) * 100,
      isPressed: true
    });
  }

  // Handler mouse move.
  handleMouseMove ({ pageX }) {
    if (this.state.isPressed) {
      const audio = this.props.audioEl;

      const { elementX, elementW } = this.state;
      const posX = clamp(pageX, elementX, elementX + elementW);
      const newVolume = (posX - elementX) / elementW;

      audio.volume = newVolume;

      this.setState({
        position: newVolume * 100,
        volume: newVolume
      });
    }
  }

  // Handler mouse up.
  handleMouseUp () {
    const { position, isPressed } = this.state;
    const audio = this.props.audioEl;

    if (!isPressed) return;

    audio.volume = (position / 100);

    this.setState({
      isPressed: false,
      volume: audio.volume
    });
  }

  handleVolClick() {
    const { volume } = this.state;
    const audio = this.props.audioEl;

    if (volume === 0) {

      audio.volume = 1;
      this.setState({
        volume : 1,
        position: 100
      });

    } else {

      audio.volume = 0;
      this.setState({
        volume : 0,
        position: 0
      });

    }
  }

  render () {
    const { position, isPressed } = this.state;
    const classes = ['pr-control-element pr-control-vol'];

    if (isPressed) classes.push('pr-is-pressed');

    let iconVol;
    if (position === 0) {
      iconVol = 'icon-volume-x'
    } else if (position < 50) {
      iconVol = 'icon-volume-1'
    } else {
      iconVol = 'icon-volume-2'
    }

    return (
      <div className={classes.join(' ')}>

        <button aria-label="Mute or unmute" onClick={this.handleVolClick}>
          <i aria-hidden="true" className={`icon ${iconVol}`}/>
        </button>

        <div className='pr-control-bar'
             onMouseDown={this.handleMouseDown}
             onTouchStart={this.handleTouchStart}
             ref={(bar) => { this.bar = bar; }}
        >
          <div className='pr-bar pr-bar-line' />
          <div className='pr-bar pr-bar-played' style={{width: `${position}%`}} />
          <div className='pr-bar-handler' style={{left: `${position}%`}} />
        </div>
      </div>
    );
  }
}

function clamp (n, min, max) {
  return Math.max(Math.min(n, max), min);
}

export default RangeVolume
