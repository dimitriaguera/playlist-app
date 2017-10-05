import React, { Component } from 'react';
import { connect } from 'react-redux'

import { get } from 'core/client/services/core.api.services'
import { getLocalToken } from 'users/client/services/users.storage.services'
import { getRoleNames } from 'users/client/services/users.auth.services'
import { Divider } from 'semantic-ui-react'

import dateFormat from 'dateformat'

class User extends Component {

    constructor(){
        super();
        this.state = {
            user: null,
            rolesNames: '',
        };
    }

    // Request user to server.
    componentWillMount(){
        const _self = this;
        const name = _self.props.match.params.userName;
        const { history } = _self.props;

        this.props.fetchUser( name )
            .then( (data) => {
                if ( !data.success ) {

                    return history.push('/not-found');
                }
                _self.setState({
                    user: data.msg,
                    rolesNames: getRoleNames(data.msg.roles),
                })
            });
    }

    render(){

        const { user, rolesNames } = this.state;

        return (
            <div>
            { !!user && (
                <div>
                    <h1>{user.username}'s User Page</h1>
                    <Divider />
                    <h3>Account name</h3>
                    <p>{user.username}</p>
                    <h3>Authorizations</h3>
                    <p>{rolesNames}</p>
                    <h3>Creation</h3>
                    <p>{dateFormat(new Date(user.created), "dd mmm yyyy - H:MM:ss")}</p>
                    <h3>Last update</h3>
                    <p>{user.updated ? dateFormat(new Date(user.updated), "dd mmm yyyy - H:MM:ss") : 'never updated'}</p>
                </div>
             )}
            </div>
        );
    }
}

const mapDispatchToProps = dispatch => {
    return {
        fetchUser: ( name ) => dispatch(
            get( 'users/' + name )
        )
    }
};

const UserContainer = connect(
    null,
    mapDispatchToProps
)(User);

export default UserContainer