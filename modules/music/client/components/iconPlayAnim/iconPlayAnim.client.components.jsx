import React, { Component } from 'react'
import {connect} from 'react-redux';
import { pauseState, playState } from 'music/client/redux/actions'

class IconPlayAnim extends Component {
  clickHandler (e) {
    const { pause, onPause, onPlay } = this.props;
    if (pause) {
      onPlay();
    } else {
      onPause();
    }
    e.stopPropagation();
  }

  render () {
    const { pause, wrapperStyle = {}, iconStyle = {} } = this.props;
    const classes = ['icon-play-anim'];

    if (pause) classes.push('pause');

    return (
      <span className='icon icon-play-anim-container' style={wrapperStyle} onClick={e => this.clickHandler(e)}>
        <span style={iconStyle} className={classes.join(' ')}>
          <span />
          <span />
          <span />
          <span />
        </span>
      </span>
    );
  }
}

const mapStateToProps = state => {
  return {
    pause: state.playlistStore.pause
  }
};

const mapDispatchToProps = dispatch => {
  return {
    onPause: () => dispatch(
      pauseState()
    ),
    onPlay: () => dispatch(
      playState()
    )
  }
};

const IconPlayAnimContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(IconPlayAnim);

export default IconPlayAnimContainer
