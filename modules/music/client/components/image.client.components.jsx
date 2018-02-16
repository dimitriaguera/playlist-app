import React, { Component } from 'react'

class Img extends Component {
  constructor (props) {
    super(props);
    this.domEl = {};
  }
  render () {
    const { defaultSrc, ...props } = this.props;
    return (
      <img ref={r => this.domEl = r} onError={() => this.domEl.src = defaultSrc} {...props} >
        {this.props.children}
      </img>
    )
  }
}

export default Img
