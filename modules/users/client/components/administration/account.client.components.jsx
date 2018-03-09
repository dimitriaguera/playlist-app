import React, { Component } from 'react';
import { connect } from 'react-redux'

import { get } from 'core/client/services/core.api.services'
import { getRoleNames } from 'users/client/services/users.auth.services'

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
          <section className='pal'>
            <header>
              <h1>{user.username}'s Account</h1>
            </header>
            <div className='wrapper-content'>
              <dl>
                <dt><h3>Account name</h3></dt>
                <dd><p>{user.username}</p></dd>
              </dl>
              <dl>
                <dt><h3>Authorizations</h3></dt>
                <dd><p>{rolesNames}</p></dd>
              </dl>
              <dl>
                <dt><h3>Creation</h3></dt>
                <dd><p>{dateFormat(new Date(user.created), 'dd mmm yyyy - H:MM:ss')}</p></dd>
              </dl>
              <dl>
                <dt><h3>Last update</h3></dt>
                <dd><p>{user.updated ? dateFormat(new Date(user.updated), 'dd mmm yyyy - H:MM:ss') : 'never updated'}</p></dd>
              </dl>
            </div>
          </section>
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
