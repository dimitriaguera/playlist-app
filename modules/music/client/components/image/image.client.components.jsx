import React, { Component } from 'react'

class Img extends Component {
  constructor (props) {
    super(props);
    this.domEl = {};
    this.flag = false;
    this.handleError = this.handleError.bind(this);
  }

  handleError(e) {

    const { defaultSrc } = this.props;

    if( !this.flag ){
      console.log(defaultSrc);
      this.domEl.src = defaultSrc;
      this.flag = true;
    } else {
      console.log('Error when loading static image');
    }
  }

  render () {
    const {defaultSrc, ...props} = this.props;
    return (
      <img ref={r => this.domEl = r} onError={this.handleError} {...props} >
        {this.props.children}
      </img>
    )
  }
}

export default Img
