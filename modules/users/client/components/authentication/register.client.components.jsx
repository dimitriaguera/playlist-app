import React, { Component } from 'react'
import store from 'core/client/redux/store'
import { Form, Button, Divider, Header, Message, Icon } from 'semantic-ui-react'
import { registerNewUser } from 'users/client/redux/actions'


class Register extends Component {

    constructor(){
        super();
        this.handleInputChange = this.handleInputChange.bind(this);
        this.checkPasswordOnBlur = this.checkPasswordOnBlur.bind(this);
        this.resetPwdError = this.resetPwdError.bind(this);
        this.submitForm = this.submitForm.bind(this);
        this.state = {
            username:'',
            password:'',
            cfPassword:'',
            isRegister: false,
            error: false,
            pwdError: false,
            pwdIcon: null,
            message:'',
        };
    }

    handleInputChange(e) {

        const target = e.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        // If password field, reset confirm password field.
        if ( name === 'password' ) {
            this.setState({
                [name]: value,
                cfPassword: '',
                pwdIcon: null,
            });
        }
        // If confirm password field, check if match with password field.
        else if ( name === 'cfPassword' ) {
            this.setState({
                [name]: value,
                pwdIcon: ( value === this.state.password ) ? true : null
            });
        }
        // Else, normal behavior.
        else {
            this.setState({
                [name]: value
            });
        }
    }

    comparePassword() {
        const { password, cfPassword } = this.state;
        return (password === cfPassword);
    }

    checkPasswordOnBlur(e) {
        const pwdMatch = this.comparePassword();
        this.setState({
            pwdError: !pwdMatch,
            pwdIcon: pwdMatch,
        });
    }

    resetPwdError(e) {
        this.setState({
            pwdError: false,
            pwdIcon: null,
        });
    }

    submitForm(e) {

        const _self = this;

        e.preventDefault();

        if ( this.state.pwdError ) return;

        store.dispatch(registerNewUser(this.state)).then( ( data ) => {
            console.log(data);
            _self.setState({
                isRegister: data.success,
                message: data.msg,
                error: !data.success,
                password: '',
                cfPassword: '',
                pwdError: false,
                pwdIcon: null,
            })
        });
    }

    render() {

        const { username, password, cfPassword, isRegister, message, error, pwdError, pwdIcon } = this.state;
        const { history } = this.props;

        // Confirm password icon builder.
        let icon;
        if ( pwdIcon === null ) icon = {};
        else icon = pwdIcon ? {icon:{color:'green', name:'checkmark'}} : {icon:{color:'red', name:'remove'}};

        return (
            <div>
                {
                    isRegister ?
                        (<div>
                            <Header>Register</Header>
                            <Message header={`Welcome ${username} !`} content="Registration successful" color='blue' />
                        </div>)
                        :
                        (<div>
                            <Header>Register</Header>
                            <Form error={error} onSubmit={this.submitForm}>
                                <Message error content={message}/>
                                <Form.Group>
                                    <Form.Input required label='Account name' placeholder='Name' name='username' value={username} onChange={this.handleInputChange} />
                                    <Form.Input required label='Password' type='password' placeholder='Password' name='password' value={password} onChange={this.handleInputChange} />
                                    <Form.Input {...icon} required label='Confirm Password' type='password' name='cfPassword' value={cfPassword} error={pwdError} onBlur={this.checkPasswordOnBlur} onFocus={this.resetPwdError} onChange={this.handleInputChange} />
                                </Form.Group>
                                <Button type='submit' content='Submit' color='blue'/>
                            </Form>
                            <Divider horizontal>Or</Divider>
                            <Button onClick={(e) => history.push('/login')} fluid>Sign in</Button>
                        </div>)}
            </div>
        )
    }
}

export default Register