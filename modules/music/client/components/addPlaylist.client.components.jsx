import React, { Component } from 'react'
import { connect } from 'react-redux'
import { post } from 'core/client/services/core.api.services'
import { Form, Message } from 'semantic-ui-react'

class AddPlaylist extends Component {
  constructor (props) {
    super(props);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.state = {
      error: false,
      message: '',
      title: ''
    }
  }

  handleInputChange (e) {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  submitForm (e) {
    const _self = this;
    const { user, createPlaylist, history, tracks, redirect, onSave } = this.props;
    const { title } = this.state;

    // User need to be authenticated.
    if (!user) {
      if (!history) {
        return _self.setState({
          error: true,
          message: 'You must login to create playlist.'
        });
      }
      else {
        return history.push('/login');
      }
    }

    // If empty field, send message error.
    if (!title) {
      return _self.setState({
        error: true,
        message: 'You must choose playlist title.'
      });
    }

    // User authenticated on any role can create playlist.
    createPlaylist({ title: title, user: user, tracks: tracks })
      .then((data) => {
        if (!data.success) {
          _self.setState({message: data.msg, error: true });
        } else {
          _self.setState({error: false, message: '', title: ''});
          if (typeof onSave === 'function') {
            onSave(data);
          }
          if (redirect) {
            return history.push(`/playlist/${title}`);
          }
        }
      });
  }

  render () {
    const { error, message, title } = this.state;
    const { placeholder = 'Playlist Title...', validation = 'Create' } = this.props;

    return (
      <Form error={error} onSubmit={this.submitForm}>
        <Message error content={message} />
        <Form.Input
          action={{ color: 'teal', labelPosition: 'left', icon: 'list layout', content: validation }}
          actionPosition='left'
          placeholder={placeholder}
          name='title'
          value={title}
          onChange={this.handleInputChange}
        />
      </Form>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.authenticationStore._user
  }
};

const mapDispatchToProps = dispatch => {
  return {
    createPlaylist: (item) => dispatch(
      post('playlist', {data: item})
    )
  }
};

const AddPlaylistContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AddPlaylist);

export default AddPlaylistContainer
