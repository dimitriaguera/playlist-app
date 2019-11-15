import React, { Component } from 'react';

class RangeSlider extends Component {
  constructor() {
    super();

    this.progressHandler = this.progressHandler.bind(this);
    this.bufferHandler = this.bufferHandler.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);

    this.state = {
      buffer: 0,
      position: 0,
      elementX: 0,
      elementW: 0,
      currentTime: 0,
      duration: 0,
      isPressed: false
    };
  }

  componentDidMount() {
    const { audioEl } = this.props;

    // Initialise duration track, and launch setInterval timer.
    if (audioEl.duration) {
      this.setState({ duration: audioEl.duration });
    }
    this.setProgressInterval();

    // On play event, start interval callback.
    audioEl.addEventListener('play', () => {
      this.setProgressInterval();
    });

    // On pause event, clear interval.
    audioEl.addEventListener('pause', () => {
      this.clearProgressInterval();
    });

    // On new tracks, reset duration, progress bar, buffer bar.
    audioEl.addEventListener('durationchange', () => {
      this.setState({
        duration: audioEl.duration,
        currentTime: 0,
        position: 0,
        buffer: 0
      });
    });

    // Apply windows touch/mouse control listeners.
    //@todo why ?
    window.addEventListener('touchmove', this.handleTouchMove);
    window.addEventListener('touchend', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  componentWillUnmount() {
    // Clear interval.
    this.clearProgressInterval();

    // Clear listeners.
    //@todo why ?
    window.removeEventListener('touchmove', this.handleTouchMove, false);
    window.removeEventListener('touchend', this.handleMouseUp, false);
    window.removeEventListener('mousemove', this.handleMouseMove, false);
    window.removeEventListener('mouseup', this.handleMouseUp, false);
  }

  // Touch start handler.
  handleTouchStart(e) {
    this.handleMouseDown(e.touches[0]);
  }

  // Touch move handler.
  handleTouchMove(e) {
    e.preventDefault();
    this.handleMouseMove(e.touches[0]);
  }

  // Set an interval to call progressHandler.
  setProgressInterval() {
    if (!this.progressInterval) {
      this.progressInterval = setInterval(() => {
        this.progressHandler();
        this.bufferHandler();
      }, 1000);
    }
  }

  // Clear the progress interval.
  clearProgressInterval() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  // Check and set buffer position.
  bufferHandler() {
    const audio = this.props.audioEl;
    const duration = audio.duration;

    if (duration > 0) {
      for (let i = 0; i < audio.buffered.length; i++) {
        if (
          audio.buffered.start(audio.buffered.length - 1 - i) < audio.currentTime
        ) {
          const time =
            (audio.buffered.end(audio.buffered.length - 1 - i) / duration) * 100;
          this.setState({
            buffer: time
          });
          break;
        }
      }
    }
  }

  // Check and set playing progress position.
  progressHandler() {
    if (!this.state.isPressed) {
      const audio = this.props.audioEl;
      const time = (audio.currentTime / audio.duration) * 100;

      this.setState({
        position: time,
        currentTime: audio.currentTime
      });
    }
  }

  // Handler mouse down.
  handleMouseDown({ pageX }) {
    const box = this.bar.getBoundingClientRect();
    const elementX = box.left;
    const elementW = box.width;

    // const posX = clamp(pageX, elementX, elementX + elementW);

    this.setState({
      elementX: elementX,
      elementW: elementW,
      position: ((pageX - elementX) / elementW) * 100,
      isPressed: true
    });
  }

  // Handler mouse move.
  handleMouseMove({ pageX }) {
    if (this.state.isPressed) {
      const { elementX, elementW, duration } = this.state;
      const posX = clamp(pageX, elementX, elementX + elementW);
      const time = (posX - elementX) / elementW;

      this.setState({
        position: time * 100,
        currentTime: time * duration
      });
    }
  }

  // Handler mouse up.
  handleMouseUp() {
    const { position, isPressed } = this.state;
    const audio = this.props.audioEl;

    if (!isPressed) return;

    audio.currentTime = (position / 100) * audio.duration;

    this.setState({
      isPressed: false
    });
  }

  render() {
    // console.log('RENDER RANGE');

    const { position, buffer, currentTime, duration, isPressed } = this.state;
    const classes = ['pr-control-element'];

    if (isPressed) classes.push('pr-is-pressed');

    return (
      <div className={classes.join(' ')}>
        <MetaTimeTracksCurrent currentTime={currentTime} />
        <div
          className="pr-control-bar"
          onMouseDown={this.handleMouseDown}
          onTouchStart={this.handleTouchStart}
          ref={bar => {
            this.bar = bar;
          }}
        >
          <div className="pr-bar pr-bar-line" />
          <div className="pr-bar pr-bar-buffed" style={{ width: `${buffer}%` }} />
          <div className="pr-bar pr-bar-played" style={{ width: `${position}%` }} />
          <div className="pr-bar-handler" style={{ left: `${position}%` }} />
        </div>
        <MetaTimeTracksEnd duration={duration} />
      </div>
    );
  }
}

class MetaTimeTracksCurrent extends Component {
  shouldComponentUpdate(nextProps) {
    const { currentTime } = nextProps;
    return currentTime !== this.props.currentTime;
  }

  render() {
    const { currentTime } = this.props;
    const cst = getFormatedTime(currentTime);

    return <span className="mtn-elmt mtn-elmt-current">{`${cst}`}</span>;
  }
}

class MetaTimeTracksEnd extends Component {
  shouldComponentUpdate(nextProps) {
    const { duration } = nextProps;
    return duration !== this.props.duration;
  }

  render() {
    const { duration } = this.props;
    const dur = getFormatedTime(duration);

    return <span className="mtn-elmt mtn-elmt-end">{`${dur}`}</span>;
  }
}

function getFormatedTime(time) {
  let s = parseInt(time % 60);
  let m = parseInt((time / 60) % 60);

  s = s >= 10 ? s : '0' + s;
  m = m >= 10 ? m : '0' + m;

  return m + ':' + s;
}

function clamp(n, min, max) {
  return Math.max(Math.min(n, max), min);
}

export default RangeSlider;
