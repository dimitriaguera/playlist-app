import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Dropdown, Menu } from 'semantic-ui-react'
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
    <Menu.Menu position='right'>
      <Dropdown text={user.username} pointing className='link item'>
        <Dropdown.Menu>
          <Dropdown.Item as={Link} to='/account'>My account</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item as='a' href='#' onClick={logoutHandler}>Logout</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </Menu.Menu>
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
  <Menu.Menu position='right'>
    <Menu.Item as={Link} to='/Login'>Login</Menu.Item>
  </Menu.Menu>
);

/**
 * Users menu entry and sub-menu.
 *
 */
export const UsersItem = () => <Menu.Item as={Link} to='/users'>Users</Menu.Item>;
