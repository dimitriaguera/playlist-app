import React, { Component } from 'react';
import { connect } from 'react-redux'

import { get } from 'core/client/services/core.api.services'
import { getLocalToken } from 'users/client/services/users.storage.services'
import { getRoleNames } from 'users/client/services/users.auth.services'
import { Divider } from 'semantic-ui-react'

import dateFormat from 'dateformat'

class Account extends Component {
  constructor () {
    super();
    this.state = {
      user: null,
      rolesNames: ''
    };
  }

  componentWillMount () {
    const _self = this;
    this.props.fetchAccount()
      .then((data) => {
        _self.setState({
          user: data.msg,
          rolesNames: getRoleNames(data.msg.roles)
        })
      });
  }

  render () {
    const { user, rolesNames } = this.state;

    const userInfo = () => {
      if (user) {
        return (
          <div>
            <h1>{user.username}'s Account</h1>
            <Divider />
            <h3>Account name</h3>
            <p>{user.username}</p>
            <h3>Authorizations</h3>
            <p>{rolesNames}</p>
            <h3>Creation</h3>
            <p>{dateFormat(new Date(user.created), 'dd mmm yyyy - H:MM:ss')}</p>
            <h3>Last update</h3>
            <p>{user.updated ? dateFormat(new Date(user.updated), 'dd mmm yyyy - H:MM:ss') : 'never updated'}</p>
          </div>
        );
      }
      return null;
    };

    return userInfo();
  }
}

const mapDispatchToProps = dispatch => {
  return {
    fetchAccount: () => dispatch(
      get('account')
    )
  }
};

const AccountContainer = connect(
  null,
  mapDispatchToProps
)(Account);

export default AccountContainer
