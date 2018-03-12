import React, { Component } from 'react'
import store from 'core/client/redux/store'
import { Form, Button, Divider, Header, Message } from 'semantic-ui-react'
import { registerNewUser } from 'users/client/redux/actions'


class Register extends Component {
  constructor () {
    super();
    this.handleInputChange = this.handleInputChange.bind(this);
    this.checkPasswordOnBlur = this.checkPasswordOnBlur.bind(this);
    this.resetPwdError = this.resetPwdError.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.state = {
      username: '',
      password: '',
      cfPassword: '',
      isRegister: false,
      error: false,
      pwdError: false,
      pwdIcon: null,
      message: ''
    };
  }

  handleInputChange (e) {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    // If password field, reset confirm password field.
    if (name === 'password') {
      this.setState({
        [name]: value,
        cfPassword: '',
        pwdIcon: null
      });
    }
    // If confirm password field, check if match with password field.
    else if (name === 'cfPassword') {
      this.setState({
        [name]: value,
        pwdIcon: (value === this.state.password) ? true : null
      });
    }
    // Else, normal behavior.
    else {
      this.setState({
        [name]: value
      });
    }
  }

  comparePassword () {
    const { password, cfPassword } = this.state;
    return (password === cfPassword);
  }

  checkPasswordOnBlur (e) {
    const pwdMatch = this.comparePassword();
    this.setState({
      pwdError: !pwdMatch,
      pwdIcon: pwdMatch
    });
  }

  resetPwdError (e) {
    this.setState({
      pwdError: false,
      pwdIcon: null
    });
  }

  submitForm (e) {
    const _self = this;

    e.preventDefault();

    if (this.state.pwdError) {
      return _self.setState({message: 'Your password and confirmation password do not match'});
    }

    store.dispatch(registerNewUser(this.state)).then((data) => {
      console.log(data);
      _self.setState({
        isRegister: data.success,
        message: data.msg,
        error: !data.success,
        password: '',
        cfPassword: '',
        pwdError: false,
        pwdIcon: null
      })
    });
  }

  render () {
    const { username, password, cfPassword, isRegister, message, error, pwdError, pwdIcon } = this.state;

    // Confirm password icon builder.
    let icon;
    if (pwdIcon === null) icon = '';
    else icon = pwdIcon ? 'icon-check' : 'icon-x';

    return (

      <section className='pal'>
        <header>
          <h1>Sign up</h1>
        </header>
        <div className='wrapper-content'>
          {
            isRegister
              ?
                <Message header={`Welcome ${username} !`} content='Registration successful' color='blue'/>
              :

              <div>

                <form onSubmit={this.submitForm}>
                  <div className='form-row'>
                    <label htmlFor='username'>Username</label>
                    <input required placeholder='Username' id='username' name='username' value={username} onChange={this.handleInputChange} />
                  </div>

                  <div className='form-row'>
                    <label htmlFor='Password'>Password</label>
                    <input required id='Password' type='password' placeholder='Password' name='password' value={password} onChange={this.handleInputChange} />
                  </div>

                  <div className='form-row'>
                    <label htmlFor='cfPassword'>Confirm Password</label>
                    <input required type='password' id='cfPassword' name='cfPassword' value={cfPassword} onBlur={this.checkPasswordOnBlur} onFocus={this.resetPwdError} onChange={this.handleInputChange} />
                    <i aria-hidden="true" className={`icon ${icon}`}></i>
                  </div>

                  <button className='btn' type='submit'>Sign up</button>

                  <Message error content={message} />
                </form>

              </div>
          }
        </div>
      </section>
    )
  }
}

export default Register
