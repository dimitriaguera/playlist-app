import React, { Component } from 'react'
import {connect} from "react-redux";
import { post } from 'core/client/services/core.api.services'
import IconPlayAnim from 'music/client/components/iconPlayAnim/iconPlayAnim.client.components'
import { playOnPlaylist, pauseState, playState } from 'music/client/redux/actions'
import Img from 'music/client/components/image/image.client.components'
import { getFormatedDate } from 'core/client/services/core.date.services'

// import defaultCover from 'assets/images/default_pl_1.jpg'
// import defaultCover from 'assets/images/default_pl_1.jpg'
// import defaultCover from 'assets/images/default_pl_1.jpg'
// import defaultCover from 'assets/images/default_pl_1.jpg'
// import defaultCover from 'assets/images/default_pl_1.jpg'
// import defaultCover from 'assets/images/default_pl_1.jpg'


class InfoPanelPlaylist extends Component {

  constructor( props ) {
    super(props);
    this.handlerPlayPlaylist = this.handlerPlayPlaylist.bind(this);
  }

  // Play a track in playlist.
  handlerPlayPlaylist (e) {

    e.preventDefault();

    const { item: playlist , pause, playingList, onPauseFunc, onPlayFunc } = this.props;

    // If this playlist already is playing, just switch pause/play.
    if (playingList.pl && (playingList.pl._id === playlist._id)) {
      if (pause) {
        return onPlayFunc();
      } else {
        return onPauseFunc();
      }
    }

    this.props.playPlaylist({
      pl: playlist,
      onPlayIndex: 0
    });
  }

  render(){
    const { item , pause, playingList, onPauseFunc, onPlayFunc } = this.props;
    const playlistIsPlaying = (playingList.pl && (playingList.pl._id === item._id));

    const getButton = () => {
      if (playlistIsPlaying) {
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
          <button aria-label='play album' onClick={this.handlerPlayPlaylist} className='btn btn-icon big'>
            <i aria-hidden='true' className='icon icon-play'/>
          </button>
        )
      } else {
        return null
      }

    };

    return (
      <div className='info-panel-playlist'>
        <div className='info-panel-playlist-img'>
          <Img title={item.title}
               src={''}
               defaultSrc={defaultCover}
          />
        </div>
        <div className='info-panel-playlist-meta'>
          <h1 className='title'>{item.title}</h1>
          <span className='label'>Playlist</span>
          <span className='author-wrapper'>
            {item.author && <span className='author'>Created by {item.author.username}</span>}
            {item.created && <span className='created'>&nbsp;on {getFormatedDate(item.created)}</span>}
          </span>
          {item.tracks && <span className='length'>{item.tracks.length} tracks</span>}
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
    playPlaylist: item => dispatch(playOnPlaylist(item)),
  }
};

const InfoPanelPlaylistContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(InfoPanelPlaylist);

export default InfoPanelPlaylistContainer
