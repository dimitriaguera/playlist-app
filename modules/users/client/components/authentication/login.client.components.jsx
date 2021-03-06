import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { loginUser } from 'users/client/redux/actions';
import { Message } from 'semantic-ui-react';

// AddExt.
import { activatePlaylist } from 'music/client/redux/actions';
// End AddExt.

class Login extends Component {
  constructor() {
    super();
    this.handleInputChange = this.handleInputChange.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.state = {
      username: '',
      password: '',
      redirectToReferrer: false,
      error: false,
      message: ''
    };
  }

  handleInputChange(e) {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  submitForm(e) {
    const _self = this;

    this.props.handleSubmit(this.state).then(data => {
      if (!data.success) {
        _self.setState({ message: data.msg, error: true });
      } else {
        _self.setState({ redirectToReferrer: true });

        // AddExt.
        _self.props.handleActivatePlaylist(data.msg.defaultPlaylist);
        // End AddExt.
      }
    });
    e.preventDefault();
  }

  render() {
    const { from } = this.props.location.state || { from: { pathname: '/' } };
    const { redirectToReferrer, username, password, message, error } = this.state;
    const { history } = this.props;

    if (redirectToReferrer) {
      console.log('LOGIN CALLED - REDIRECT');
      return <Redirect to={from} />;
    }

    console.log('LOGIN CALLED - PAS REDIRECT');
    return (
      <section className="pal">
        <header>
          <h1>Log in</h1>
        </header>
        <div className="wrapper-content">
          <form onSubmit={this.submitForm}>
            <input
              aria-label="Username"
              required
              placeholder="Username"
              name="username"
              value={username}
              onChange={this.handleInputChange}
            />
            <input
              aria-label="Password"
              required
              type="password"
              placeholder="Password"
              name="password"
              value={password}
              onChange={this.handleInputChange}
            />
            <button className="btn" type="submit">
              Log in
            </button>
            <Message error content={message} />
          </form>
        </div>
      </section>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleSubmit: creds => dispatch(loginUser(creds)),
    // AddExt.
    handleActivatePlaylist: item => dispatch(activatePlaylist(item))
    // End AddExt.
  };
};

const LoginContainer = connect(null, mapDispatchToProps)(Login);

export default LoginContainer;
