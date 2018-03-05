import React, { Component } from 'react'

class Img extends Component {
  constructor (props) {
    super(props);
    this.domEl = {};
    this.flag = false;
    this.handleError = this.handleError.bind(this);
  }

  handleError() {
    if( !this.flag ) {
      this.domEl.src = (this.props.defaultSrc) ? this.props.defaultSrc : '';
      this.flag = true;
    }
  }

  componentWillReceiveProps(){
    this.flag = false;
  }

  render () {
    const {defaultSrc, ...props} = this.props;

    return (
      <img ref={r => this.domEl = r} onError={this.handleError} {...props} >
        {props.children}
      </img>
    )
  }
}

export default Img
