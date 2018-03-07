import React from 'react'
import {connect} from 'react-redux'
import {NavLink} from 'react-router-dom'

import {logoutUser} from 'users/client/redux/actions'

// AddExt.
import {activatePlaylist} from 'music/client/redux/actions'
// End AddExt.


// Users menu entry.
export const UsersItem = () => <NavLink to='/users' activeClassName="nav-selected">Users</NavLink>;

// Login menu entry.
export const LoginItem = () => (
  <NavLink to="/Login" activeClassName="nav-selected">Login</NavLink>
);

// Login myAccountItem
export const MyAccountItem = () => <NavLink to='/account' activeClassName="nav-selected">See my account</NavLink>;

/////////////////////////
// LogoutItem
const LogoutItemContainer = ({logoutHandler}) => {
  return (<a href='#' onClick={logoutHandler}>Logout</a>)
};

const mapDispatchToProps = (dispatch) => {
  return {
    logoutHandler: e => {
      e.preventDefault();
      dispatch(logoutUser());

      // AddExt.
      dispatch(activatePlaylist(null));
      // End AddExt.
    }
  }
};

export const LogoutItem = connect(
  null,
  mapDispatchToProps,
  null,
  {pure: false}
)(LogoutItemContainer);
/////////////////////////