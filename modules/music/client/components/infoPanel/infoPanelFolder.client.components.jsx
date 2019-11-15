import React, { Component } from 'react';
import { connect } from 'react-redux';
import { post } from 'core/client/services/core.api.services';
import IconPlayAnim from 'music/client/components/iconPlayAnim/iconPlayAnim.client.components';
import { playOnFolder, pauseState, playState } from 'music/client/redux/actions';
import ps from 'core/client/services/core.path.services';
import { getFormatedDate } from 'core/client/services/core.date.services';

class InfoPanelFolder extends Component {
  constructor(props) {
    super(props);
    this.handlerPlayTrack = this.handlerPlayTrack.bind(this);
    this.handlerAddTracks = this.handlerAddTracks.bind(this);
    this.handlerOpenFolder = this.handlerOpenFolder.bind(this);
    this.handlerRootFolder = this.handlerRootFolder.bind(this);
  }

  // Handler onClick on a folder link.
  // Return list a folder content.
  handlerOpenFolder(e, path) {
    const { history } = this.props;

    // Update component via url update.
    history.push(`/music/${path}`);
    e.preventDefault();
  }

  // Handler that return root folder content.
  handlerRootFolder(e) {
    const { history } = this.props;

    // Update component via url update.
    history.push(`/music`);
    e.preventDefault();
  }

  // Play a track in playlist.
  handlerPlayTrack(e) {
    e.preventDefault();

    const { item, pause, playingList, onPauseFunc, onPlayFunc } = this.props;

    // If this folder is already playing, just switch pause/play.
    if (playingList.pl && playingList.pl.path === item.path) {
      if (pause) {
        return onPlayFunc();
      } else {
        return onPauseFunc();
      }
    }

    this.props.playFolder({
      pl: item,
      onPlayIndex: 0
    });
  }

  handlerAddTracks(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const {
      item,
      addPlaylistItems,
      activePlaylist,
      user,
      history,
      location
    } = this.props;

    // Get id from tracks.
    const tracksId = item.tracks.map(item => item._id);

    // User must be connected to add tracks.
    if (!user)
      return history.push({
        pathname: '/login',
        state: { from: location.pathname }
      });

    // Add tracks into activated Playlist.
    if (activePlaylist) addPlaylistItems(activePlaylist.title, { tracks: tracksId });
  }

  render() {
    const { item, pause, playingList, onPauseFunc, onPlayFunc } = this.props;
    const folderIsPlaying = playingList.pl && playingList.pl.path === item.path;

    const getButton = () => {
      if (folderIsPlaying) {
        if (pause) {
          return (
            <button
              aria-label="resume play album"
              onClick={onPlayFunc}
              className="btn btn-icon big"
            >
              <i aria-hidden="true" className="icon icon-pause" />
            </button>
          );
        } else {
          return (
            <button
              aria-label="pause album"
              onClick={onPauseFunc}
              className="btn btn-icon big"
            >
              <IconPlayAnim onClick={pause} />
            </button>
          );
        }
      } else if (item.tracks.length > 0) {
        return (
          <button
            aria-label="play album"
            onClick={this.handlerPlayTrack}
            className="btn btn-icon big"
          >
            <i aria-hidden="true" className="icon icon-play" />
          </button>
        );
      } else {
        return null;
      }
    };

    return (
      <div className="info-panel-folder">
        {item.path && (
          <Bread
            path={ps.splitPath(item.path)}
            handlerOpenFolder={this.handlerOpenFolder}
            handlerRootFolder={this.handlerRootFolder}
          />
        )}
        <div className="info-panel-folder-img">
          <i aria-hidden="true">
            <span className="icon icon-folder icon-xxl" />
          </i>
        </div>
        <div className="info-panel-folder-meta">
          <h1 className="title">{item.title}</h1>
          <span className="label">Folder</span>
        </div>
        <div className="info-panel-folder-menu">
          {getButton()}
          <button
            aria-label="add album tracks to playlist"
            onClick={this.handlerAddTracks}
            className="btn btn-icon big"
          >
            <i aria-hidden="true" className="icon icon-plus" />
          </button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.authenticationStore._user,
    pause: state.playlistStore.pause,
    playingList: state.playlistStore.playingList,
    activePlaylist: state.playlistStore.activePlaylist
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onPlayFunc: () => dispatch(playState()),
    onPauseFunc: () => dispatch(pauseState()),
    playFolder: item => dispatch(playOnFolder(item)),
    addPlaylistItems: (title, items) =>
      dispatch(
        post(`playlist/${title}`, {
          data: items
        })
      )
  };
};

const InfoPanelFolderContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(InfoPanelFolder);

//// Helper
function Bread({ path, handlerOpenFolder, handlerRootFolder }) {
  const l = path.length;

  return (
    <nav>
      <ul className="unstyled breadcrumb-ul flex-container">
        <li key="0" className="breadcrumb-li" style={{ cursor: 'pointer' }}>
          <a
            href="#"
            onClick={handlerRootFolder}
            title="Home"
            className="breadcrumb-a"
          >
            <i aria-hidden="true" className="icon icon-home icon-m" />
            {l > 0 && (
              <i aria-hidden="true" className="icon icon-chevron-right icon-m" />
            )}
          </a>
        </li>
        {path.map((item, i) => {
          // Check if not last item
          return (
            <li key={i + 1} className="breadcrumb-li" style={{ cursor: 'pointer' }}>
              <a
                href="#"
                title={item}
                className="breadcrumb-a"
                onClick={e =>
                  handlerOpenFolder(e, ps.buildPath(path.slice(0, i + 1)))
                }
              >
                {item}
                {l !== i + 1 && (
                  <i aria-hidden="true" className="icon icon-chevron-right icon-m" />
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default InfoPanelFolderContainer;
