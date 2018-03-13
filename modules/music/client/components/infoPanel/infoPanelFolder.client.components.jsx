import React, { Component } from 'react'
import {connect} from "react-redux";
import { post } from 'core/client/services/core.api.services'
import IconPlayAnim from 'music/client/components/iconPlayAnim/iconPlayAnim.client.components'
import { playOnFolder, pauseState, playState } from 'music/client/redux/actions'
import defaultCover from 'assets/images/default_cover.png'
import ps from 'core/client/services/core.path.services'
import Img from 'music/client/components/image/image.client.components'
import { getFormatedDate } from 'core/client/services/core.date.services'

class InfoPanelFolder extends Component {

  constructor( props ) {
    super(props);
    this.handlerReadTrack = this.handlerReadTrack.bind(this);
    this.handlerOpenFolder = this.handlerOpenFolder.bind(this);
    this.handlerRootFolder = this.handlerRootFolder.bind(this);
  }

  // Handler onClick on a folder link.
  // Return list a folder content.
  handlerOpenFolder (e, path) {
    const { history } = this.props;

    // Update component via url update.
    history.push(`/music/${path}`);
    e.preventDefault();
  }

  // Handler that return root folder content.
  handlerRootFolder (e) {
    const { history } = this.props;

    // Update component via url update.
    history.push(`/music`);
    e.preventDefault();
  }

  // Play a track in playlist.
  handlerReadTrack(e) {
    e.preventDefault();

    const { item , pause, playingList, onPauseFunc, onPlayFunc } = this.props;

    // If this folder is already playing, just switch pause/play.
    if (playingList.pl && (playingList.pl.path === item.path)) {
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
  render(){
    const { item , pause, playingList, onPauseFunc, onPlayFunc } = this.props;
    const folderIsPlaying = (playingList.pl && (playingList.pl.path === item.path));

    const getButton = () => {
      if (folderIsPlaying) {
        if (pause) {
          return (
            <button aria-label='resume play album' onClick={onPlayFunc} className='btn btn-icon big'>
              <i aria-hidden='true' className='icon icon-pause'/>
            </button>
          )
        } else {
          return (
            <button aria-label='pause album' onClick={onPauseFunc} className='btn btn-icon big'>
              <IconPlayAnim onClick={pause}/>
            </button>
          )
        }
      } else if (item.tracks.length > 0) {
        return (
          <button aria-label='play album' onClick={this.handlerReadTrack} className='btn btn-icon big'>
            <i aria-hidden='true' className='icon icon-play'/>
          </button>
        )
      } else {
        return null
      }
    };

    return (
      <div className='info-panel-playlist'>
        {item.path && <Bread path={ps.splitPath(item.path)} handlerOpenFolder={this.handlerOpenFolder} handlerRootFolder={this.handlerRootFolder} />}
        <div className='info-panel-playlist-img'>
          <i aria-hidden="true"><span className='icon icon-folder icon-xxl' /></i>
        </div>
        <div className='info-panel-playlist-meta'>
          <h1 className='title'>{item.title}</h1>
          <span className='label'>Folder</span>
        </div>
        <div className='info-panel-playlist-menu'>
          {getButton()}
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
    mode: state.playlistStore.mode,
    activePlaylist: state.playlistStore.activePlaylist,
  }
};

const mapDispatchToProps = dispatch => {
  return {
    onPlayFunc: () => dispatch(playState()),
    onPauseFunc: () => dispatch(pauseState()),
    playFolder: item => dispatch(playOnFolder(item)),
  }
};

const InfoPanelFolderContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(InfoPanelFolder);

//// Helper
function Bread ({ path, handlerOpenFolder, handlerRootFolder }) {

  const l = path.length;

  return (
    <nav>
      <ul className="unstyled breadcrumb-ul flex-container">
        <li key='0' className="breadcrumb-li" style={{'cursor': 'pointer'}}>
          <a href="#" onClick={handlerRootFolder} title='Home' className="breadcrumb-a">
            <i aria-hidden="true" className='icon icon-home icon-m' />
            { (l>0) && <i aria-hidden="true" className='icon icon-chevron-right icon-m' />}
          </a>
        </li>
        {path.map((item, i) => {
          // Check if not last item
          if (l !== i + 1) {
            return (
              <li key={i+1} className="breadcrumb-li" style={{'cursor': 'pointer'}}>
                <a href="#" title={item} className="breadcrumb-a" onClick={(e) => handlerOpenFolder(e, ps.buildPath(path.slice(0, i + 1)))}>
                  {item}
                  <i aria-hidden="true" className='icon icon-chevron-right icon-m' />
                </a>

              </li>
            );
          } else {
            return (
              <li key={i+1} className="breadcrumb-li">
                    <span title={item} className="breadcrumb-a">
                      {item}
                    </span>
              </li>
            );
          }


        })}
      </ul>
    </nav>
  )
}

export default InfoPanelFolderContainer
