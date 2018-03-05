import React from 'react'
import {connect} from 'react-redux'
import {NavLink, Link} from 'react-router-dom'
import {Dropdown} from 'semantic-ui-react'
import {logoutUser} from 'users/client/redux/actions'

// AddExt.
import {activatePlaylist} from 'music/client/redux/actions'
// End AddExt.

/**
 * Account menu entry and sub-menu.
 *
 */
const AccountItemInner = ({user, logoutHandler}) => {
  console.log('render account item');
  return (
    <li className='main-nav-li'>
      <ul className="unstyled main-nav-ul">
        <span className="main-nav-logged-user">{user.username}</span>
        <li className="main-nav-li">
          <NavLink to='/account' activeClassName="nav-selected">
            See my account
          </NavLink>
        </li>
        <li className="main-nav-li">
          <a href='#' onClick={logoutHandler}>
            Logout
          </a>
        </li>
      </ul>
    </li>
  )
};

const mapStateToProps = state => {
  return {
    user: state.authenticationStore._user
  }
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

export const AccountItem = connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  {pure: false}
)(AccountItemInner);


/**
 * Login menu entry.
 *
 */
export const LoginItem = () => (
  <li className='main-nav-li'>
    <NavLink to="/Login" activeClassName="nav-selected">Login</NavLink>
  </li>
);

/**
 * Users menu entry and sub-menu.
 *
 */
export const UsersItem = () => <li className='main-nav-li'><NavLink to='/users' activeClassName="nav-selected">Users</NavLink></li>;
