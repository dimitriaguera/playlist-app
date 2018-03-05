import React from 'react'
import { connect } from 'react-redux'
import { NavLink, Link } from 'react-router-dom'
import { Dropdown } from 'semantic-ui-react'
import { logoutUser } from 'users/client/redux/actions'

// AddExt.
import { activatePlaylist } from 'music/client/redux/actions'
// End AddExt.

/**
 * Account menu entry and sub-menu.
 *
 */
const AccountItemInner = ({user, logoutHandler}) => {
  console.log('render account item');
  return (
    <li>
      <Dropdown text={user.username} pointing className='link item'>
        <Dropdown.Menu>
          <Dropdown.Item as={Link} to='/account'>My account</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item as='a' href='#' onClick={logoutHandler}>Logout</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </li>
  );
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
  mapDispatchToProps
)(AccountItemInner);


/**
 * Login menu entry.
 *
 */
export const LoginItem = () => (
  <li>
    <NavLink to="/Login" activeClassName="nav-selected">Login</NavLink>
  </li>
);

/**
 * Users menu entry and sub-menu.
 *
 */
export const UsersItem = () => <li><NavLink to='/users' activeClassName="nav-selected">Users</NavLink></li>;
