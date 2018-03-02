/**
 * Boot component permit to threat async actions before calling App,
 * for exemple to check if token exist on sessionStorage,
 * and set store to authenticated.
 */

import React, { Component } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { connect } from 'react-redux'

import { Loader } from 'semantic-ui-react'
import bootstrap from '../redux/bootstrap'
import App from './App.jsx';

class Boot extends Component {

  constructor () {
    super();

    // Application's tags
    this.application = (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Loader's tags
    this.onBoot = (
      <Loader active />
    );
  }

  // Start boot process.
  componentWillMount () {
    bootstrap();
  }

  render () {
    // If boot session end, call App.
    // Else, call Loader.
    if (this.props.isBooted) {
      return this.application;
    } else {
      return this.onBoot;
    }

  }
}

const mapStateToProps = state => {
  return {
    isBooted: state.bootStore.isBooted
  }
};

export default connect(mapStateToProps)(Boot);
