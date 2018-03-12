import React, { Component } from 'react';
import { connect } from 'react-redux'
import { put, get } from 'core/client/services/core.api.services'
import { hasRole } from 'users/client/services/users.auth.services'
import { ALL_ROLE, ADMIN_ROLE, DEFAULT_AUTH_ROLE } from 'users/commons/roles'
import { Message } from 'semantic-ui-react'

import dateFormat from 'dateformat'

class EditUser extends Component {
  constructor () {
    super();

    this.handleUpdateUser = this.handleUpdateUser.bind(this);

    this.handleChangeCheckBox = this.handleChangeCheckBox.bind(this);

    this.state = {
      user: null,
      formRoles: {},
      errorUpdate: null
    };
  }

  // Make Form input controlled.
  handleChangeCheckBox (e) {
    const value = e.target.checked;
    const name = e.target.name;

    this.setState((prevState) => {
      const state = Object.assign({}, prevState);
      this.state.formRoles[name] = value;
      this.state.errorUpdate = null;
      return state;
    });
  }

  // Request user to server.
  componentWillMount () {
    const _self = this;
    const name = _self.props.match.params.userName;
    const { history } = _self.props;

    this.props.fetchUser(name)
      .then((data) => {
        if (!data.success) {
          return history.push('/not-found');
        }
        _self.setState({
          user: data.msg,
          formRoles: setRoleArray(data.msg.roles)
        })
      });
  }

  handleUpdateUser (e) {
    e.preventDefault();
    const _self = this;
    const { user, formRoles } = this.state;
    const name = _self.props.match.params.userName;

    const update = {
      roles: getRoleArray(formRoles)
    };

    this.props.updateUser(name, update)
      .then((data) => {
        if (!data.success) {
          return _self.setState({
            errorUpdate: true
          })
        }
        _self.setState({
          user: _.merge(user, update),
          errorUpdate: false
        })
      });
  }

  render () {
    const { user, errorUpdate } = this.state;
    const { currentUser } = this.props;

    if (user) {
      // Built role's choice checkboxes.
      const rolesForm = ALL_ROLE.map((role, index) => {
        let props = {};

        // If default user role, can't be unchecked.
        if (role.id === DEFAULT_AUTH_ROLE.id) {
          props.checked = true;
          props.disabled = true;
        }

        // If user is currrent connected user and as admin role, can't be unchecked.
        else if (role.id === ADMIN_ROLE.id && hasRole(user, [role]) && (currentUser.username === user.username)) {
          props.checked = true;
          props.disabled = true;
        }

        // If user has role, default check it.
        else if (hasRole(user, [role])) {
          props.defaultChecked = true;
        }

        return (
          <li key={index}>
            <input id={role.id} name={role.id} className='checkbox' type='checkbox' defaultChecked={props.defaultChecked} checked={props.checked} disabled={props.disabled} onChange={this.handleChangeCheckBox}/>
            <label htmlFor={role.id}>{role.name}</label>
          </li>
        );
      });

      const renderMessage = () => {
        if (errorUpdate === null) {
          return null;
        }
        else if (errorUpdate) {
          return <Message error content='Problem occurs during update. Please try again or contact administrator.' />;
        }
        else {
          return <Message success content={`Changes successfully updated on ${dateFormat(new Date(), 'dd mmm yyyy - H:MM:ss')}`} />;
        }
      };

      // Render form.
      return (
        <section className='pal'>
          <header>
            <h1>Edit {user.username} account</h1>
          </header>
          <div className='wrapper-content'>
            <h2>Authorizations</h2>
            <form onSubmit={this.handleUpdateUser}>
              <ul className='unstyled'>
                {rolesForm}
              </ul>
              <button className='btn' type='submit'>Save</button>
              {renderMessage()}
            </form>
          </div>
        </section>
      );
    } else {
      return null;
    }
  }
}

const mapStateToProps = state => {
  return {
    currentUser: state.authenticationStore._user
  }
};

const mapDispatchToProps = dispatch => {
  return {
    fetchUser: (name) => dispatch(
      get('users/' + name)
    ),
    updateUser: (name, update) => dispatch(
      put('users/' + name, {
        data: update
      })
    )
  }
};

const EditUserContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(EditUser);


// HELPER FUNCTION
function getRoleArray (obj) {
  const roles = [];
  for (let key in obj) {
    if (obj.hasOwnProperty(key) && (obj[key] === true)) roles.push(key);
  }
  return roles;
}

function setRoleArray (array) {
  const roles = {};
  for (let i = 0; i < array.length; i++) {
    roles[array[i]] = true;
  }
  return roles;
}

export default EditUserContainer
