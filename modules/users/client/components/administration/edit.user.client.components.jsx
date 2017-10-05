import React, { Component } from 'react';
import { connect } from 'react-redux'
import { put, get } from 'core/client/services/core.api.services'
import { hasRole } from 'users/client/services/users.auth.services'
import { getLocalToken } from 'users/client/services/users.storage.services'
import { ALL_ROLE, ADMIN_ROLE, DEFAULT_AUTH_ROLE } from 'users/commons/roles'
import { Form, Checkbox, Button, Header, Divider, Message } from 'semantic-ui-react'

import dateFormat from 'dateformat'

class EditUser extends Component {

    constructor(){
        super();
        this.handleCheckChange = this.handleCheckChange.bind(this);
        this.handleUpdateUser = this.handleUpdateUser.bind(this);
        this.state = {
            user: null,
            formRoles: {},
            errorUpdate: null,
        };
    }

    // Make Form input controlled.
    handleCheckChange(e, data) {
        const value = data.checked;
        const name = data.name;

        this.setState((prevState) => {

            const state = Object.assign( {}, prevState );
            state.formRoles[name] = value;
            state.errorUpdate = null;
            return state;
        });
    }

    // Request user to server.
    componentWillMount() {
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
                    formRoles: setRoleArray(data.msg.roles),
                })
            });
    }

    handleUpdateUser() {

        const _self = this;
        const { user, formRoles } = this.state;
        const name = _self.props.match.params.userName;

        const update = {
            roles: getRoleArray( formRoles ),
        };

        this.props.updateUser( name, update )
            .then( (data) => {
                if ( !data.success ){
                    return _self.setState({
                        errorUpdate: true,
                    })
                }
                _self.setState({
                    user: _.merge( user, update ),
                    errorUpdate: false,
                })
            });
    }

    render(){

        const { user, errorUpdate } = this.state;
        const { currentUser } = this.props;

        if ( !!user ) {

            // Built role's choice checkboxes.
            const rolesForm = ALL_ROLE.map((role, index)=>{

                let props = {};

                // If default user role, can't be unchecked.
                if (role.id === DEFAULT_AUTH_ROLE.id) {
                    props.checked = true;
                    props.disabled = true;
                }

                // If user is currrent connected user and as admin role, can't be unchecked.
                else if ( role.id === ADMIN_ROLE.id && hasRole(user, [role]) && (currentUser.username === user.username)) {
                    props.checked = true;
                    props.disabled = true;
                }

                // If user has role, default check it.
                else if ( hasRole(user, [role]) ) {
                    props.defaultChecked = true;
                }

                return (
                    <Form.Field key={index}>
                        <Checkbox {...props} name={role.id} label={role.name} onChange={this.handleCheckChange}/>
                    </Form.Field>
                );
            });

            const renderMessage = () => {
                if ( errorUpdate === null ) {
                    return null;
                }
                else if ( errorUpdate ) {
                    return <Message error content='Problem occurs during update. Please try again or contact administrator.'/>;
                }
                else {
                    return <Message success content={`Changes successfully updated on ${dateFormat(new Date(), "dd mmm yyyy - H:MM:ss")}`}/>;
                }
            };

            // Render form.
            return (
                <div>
                    <div>
                        <Header as="h1">Edit {user.username} account</Header>
                        <Divider />
                        {renderMessage()}
                        <Header as="h2">Authorizations</Header>
                        <Form onSubmit={this.handleUpdateUser}>
                            {rolesForm}
                            <Divider />
                            <Button type='submit' content='Save' color='blue'/>
                        </Form>
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }
}

const mapStateToProps = state => {
    return {
        currentUser: state.authenticationStore._user,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        fetchUser: ( name ) => dispatch(
            get( 'users/' + name )
        ),
        updateUser: ( name, update ) => dispatch(
            put( 'users/' + name, {
                data: update,
            })
        ),
    }
};

const EditUserContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(EditUser);


// HELPER FUNCTION
function getRoleArray( obj ) {
    const roles = [];
    for ( let key in obj ) {
        if ( obj.hasOwnProperty(key) && (obj[key] === true) ) roles.push(key);
    }
    return roles;
}

function setRoleArray( array ) {
    const roles = {};
    for ( let i = 0; i < array.length; i++ ) {
        roles[array[i]] = true;
    }
    return roles;
}

export default EditUserContainer