import React, { Component } from 'react'
import { connect } from 'react-redux'
import { post } from 'core/client/services/core.api.services'
import { Message } from 'semantic-ui-react'

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
    e.preventDefault();

    const _self = this;
    const { user, createPlaylist, history, tracksId, redirect, onSave } = this.props;
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
    createPlaylist({ title: title, user: user, tracks: tracksId })
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

    return (
      <form className='allpl-form add-pl-form' onSubmit={this.submitForm}>
        <input className='allpl-create' type="submit" value="Create" className='btn'/>
        <input
          placeholder='Create new playlist'
          name='title'
          value={title}
          onChange={this.handleInputChange}
          aria-describedby="Playlist name to create"
          className='allpl-title'
        />
        <Message className='allpl-message' error content={message} />
      </form>
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
