

import React, { Component } from 'react'
import { Route, Redirect } from 'react-router-dom'
import { connect } from 'react-redux'
import { hasRole } from 'users/client/services/users.auth.services'

const PrivateRouteComp = ({ component: Component, roles, isAuthenticated, user, ...rest }) => (
  <Route {...rest} render={props => {
    const rolePermission = roles ? hasRole(user, roles) : true;

    let nextRoute;

    // If permission role asked and no permission match.
    // Go Home
    if (!rolePermission) {
      nextRoute =
        <Redirect to={{
          pathname: '/',
          state: { from: props.location }
        }} />;
    }

    // Non authenticated.
    // Go login.
    else if (!isAuthenticated) {
      nextRoute = <Redirect to={{
        pathname: '/login',
        state: { from: props.location }
      }} />;
    }

    // If all good.
    // Go destination.
    else {
      nextRoute = <Component {...props} />;
    }

    return nextRoute;
  }} />
);

const mapStateToProps = state => {
  return {
    isAuthenticated: state.authenticationStore.isAuthenticated,
    user: state.authenticationStore._user
  }
};

const PrivateRoute = connect(mapStateToProps)(PrivateRouteComp);

export default PrivateRoute
