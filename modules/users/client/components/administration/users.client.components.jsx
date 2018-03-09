import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import update from 'immutability-helper'
import { ADMIN_ROLE, ALL_ROLE } from 'users/commons/roles'
import { get, del } from 'core/client/services/core.api.services'
import { hasRole } from 'users/client/services/users.auth.services'
import { List, Confirm, Button, Divider } from 'semantic-ui-react'
import socketServices from 'core/client/services/core.socket.services'
import Modal from 'react-modal'

import dateFormat from 'dateformat'

class Users extends Component {
  constructor () {
    super();
    this.socket = socketServices.getPrivateSocket();
    this.handleOpen = this.handleOpen.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleSettings = this.handleSettings.bind(this);

    this.state = {
      users: [],
      modal: {
        open: false,
        name: '',
        index: null
      }
    }
  }

  // Request API server on mounting component.
  componentWillMount () {
    const _self = this;

    // React Modal
    Modal.setAppElement("#root");

    // Fetch users.
    this.props.fetchUsers().then((data) => {
      if (data.success) {
        _self.setState({users: data.msg})
      }
    });

    // Update users list with Socket.io
    this.socket.on('save:user', (data) => {
      const users = _self.state.users.slice(0);
      users.push(data);
      _self.setState({ users: users })
    });
  }

  // On unmount component, disconnect Socket.io.
  componentWillUnmount () {
    this.socket.disconnect();
    console.log('Disconnecting Socket as component will unmount');
  }

  // Handle func when open Confirm Box.
  handleOpen (e, name, i) {
    e.preventDefault();
    e.stopPropagation();

    this.setState({modal: {
      open: true,
      name: name,
      index: i
    }});
  }

  // Handle for cancel Confirm Box.
  handleCancel () {
    this.setState({modal: {
      open: false,
      name: '',
      index: null
    }});
  }

  // Handle for confirm Confirm Box.
  handleConfirm () {
    this.deleteUser(this.state.modal.name, this.state.modal.index);
    this.setState({modal: {
      open: false,
      name: '',
      index: null
    }});
  }

  handleSettings(e, username) {
    e.preventDefault();
    e.stopPropagation();
    this.props.history.push('/user/edit/' + username);
  }


  // Prepair and call deleteUser props func.
  deleteUser (name, i) {
    const _self = this;
    this.props.deleteUser(name)
      .then((data) => {
        if (data.success) {
          const { users } = _self.state;
          const newUsers = update(users, {$splice: [[i, 1]]});
          _self.setState({ users: newUsers });
        }
      });
  }

  render () {
    // Get state and props properties.
    const { users, modal } = this.state;
    const { currentUser } = this.props;

    // Build user list.
    const userList = users.map((user, index) => {
      return (
        <UserListItem
          key={user._id}
          user={user}
          currentUser={currentUser}
          index={index}
          handleOpen={this.handleOpen}
          handleSettings={this.handleSettings}
        />
      );
    });

    return (
      <section className='pal'>
        <header>
          <h1>All users</h1>
        </header>
        <div className='wrapper-content'>
          <ul className='unstyled'>
            {userList}
          </ul>


          <Modal
            isOpen={modal.open}
            onRequestClose={this.handleCancel}
            className="modal"
            overlayClassName="modal-overlay"
          >
            <h2>
              <i aria-hidden="true" className="icon icon-trash-2 icon-xl"/>
              Are you sure ?
            </h2>

            <div className="modal-content">
              <p>Do you whant to delete user : {this.state.modal.name}</p>
            </div>

            <div className="modal-actions">
              <button onClick={this.handleCancel} className="btn btn-no btn-inverted modal-btn">
                <i aria-hidden="true" className="icon icon-x modal-btn-icon"/>No
              </button>
              <button onClick={this.handleConfirm} className="btn btn-yes btn-inverted modal-btn">
                <i aria-hidden="true" className="icon icon-check modal-btn-icon"/>Yes
              </button>
            </div>

          </Modal>
        </div>
      </section>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    fetchUsers: () => dispatch(
      get('users')
    ),
    deleteUser: (name) => dispatch(
      del('users/' + name)
    )
  }
};

const mapStateToProps = state => {
  return {
    loading: state.apiStore.isFetching,
    currentUser: state.authenticationStore._user
  }
};

const UsersContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Users);

class UserListItem extends Component {

  shouldComponentUpdate (nextProps) {
    return (
    // Re-render component if
    // User data or index change.
      (nextProps.users !== this.props.users) ||
            (nextProps.index !== this.props.index)
    );
  }

  render () {
    const {user, index, handleOpen, handleSettings, currentUser} = this.props;
    let roles = '';

    for (let i = 0; i < user.roles.length; i++) {
      for (let j = 0; j < ALL_ROLE.length; j++) {
        if (user.roles[i] === ALL_ROLE[j].id) roles = `${roles} ${i !== 0 ? '/' : ' '} ${ALL_ROLE[j].name}`
      }
    }

    const deleteButton = () => {
      if (!(hasRole(user, [ADMIN_ROLE]) && (currentUser.username === user.username))) {
        return (
          <button className='btn btn-icon' aria-label={`Delete user ${user.username}`} onClick={(e) => handleOpen(e, user.username, index)}>
            <i aria-hidden="true" className='icon icon-trash-2'/>
          </button>
        );
      }
      return null;
    };

    console.log('RENDER LIST');

    return (
      <li>
        <Link to={`/user/${user.username}`}>

          <h3 aria-label='User Name'>{user.username}</h3>

          <div className='users-actions'>
            <button className='btn btn-icon' aria-label={`Change user ${user.username} setting's`} onClick={(e) => handleSettings(e, user.username)}>
              <i aria-hidden="true" className='icon icon-settings'/>
            </button>
            {deleteButton()}
          </div>

          <div className='users-roles'>
            {roles}
          </div>

          <div className='users-updated'>
            {user.updated ? `Last update on ${dateFormat(new Date(user.updated), 'dd mmm yyyy - H:MM:ss')}` : `Created on ${dateFormat(new Date(user.created), 'dd mmm yyyy - H:MM:ss')}`}
          </div>

        </Link>
      </li>
    );
  }
}

export default UsersContainer
