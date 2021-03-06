import React, { Component } from 'react';
import { connect } from 'react-redux';
import { del } from 'core/client/services/core.api.services';
import { activatePlaylist, addPlaylistToPlay } from 'music/client/redux/actions';
import { Menu } from 'semantic-ui-react';

class MenuEditPlaylist extends Component {
  constructor() {
    super();
    this.deleteHandler = this.deleteHandler.bind(this);
    this.state = {
      error: false,
      message: ''
    };
  }

  deleteHandler(e) {
    const _self = this;
    const {
      target,
      onDelete,
      history,
      playingList,
      activePlaylist,
      clearPlayingList,
      clearActiveList
    } = _self.props;

    onDelete(target.title).then(data => {
      if (!data.success) {
        return _self.setState({ error: true, message: 'Suppression failed' });
      }

      if (playingList.pl && playingList.pl.title === target.title) {
        clearPlayingList();
      }

      if (activePlaylist && activePlaylist.title === target.title) {
        clearActiveList();
      }

      return history.push('/');
    });
  }

  render() {
    const { history, target, user } = this.props;

    if (!user) return null;

    return (
      <Menu>
        <Menu.Item onClick={() => history.push(`/music?pl=${target.title}`)}>
          <i aria-hidden="true" className="icon icon-plus" />
          Add Tracks
        </Menu.Item>
        <Menu.Menu position="right">
          <Menu.Item onClick={this.deleteHandler}>Delete playlist</Menu.Item>
        </Menu.Menu>
      </Menu>
    );
  }
}
const mapStateToProps = state => {
  return {
    playingList: state.playlistStore.playingList,
    activePlaylist: state.playlistStore.activePlaylist,
    user: state.authenticationStore._user
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onDelete: title => dispatch(del(`playlist/${title}`)),
    clearPlayingList: () => dispatch(addPlaylistToPlay({ pl: null, onPayIndex: 0 })),
    clearActiveList: () => dispatch(activatePlaylist(null))
  };
};

const MenuEditPlaylistContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(MenuEditPlaylist);

export default MenuEditPlaylistContainer;
