import React, {Component} from 'react'
import {connect} from 'react-redux'
import {get} from 'core/client/services/core.api.services'
import {playItem} from 'music/client/redux/actions'
import SearchMusicBar from 'music/client/components/searchMusicBar/searchMusicBar.client.components'
import Img from 'music/client/components/image/image.client.components'
import splitFetchHOC from 'lazy/client/components/lazy.client.splitFetchHOC'
import ps from 'core/client/services/core.path.services'
import IconPlayAnim from 'music/client/components/iconPlayAnim/iconPlayAnim.client.components'

import defaultCover from 'assets/images/default_cover.png'
import {post} from "core/client/services/core.api.services";
import {pauseState, playState} from "../redux/actions";

class AllTracks extends Component {
  constructor(props) {
    super(props);

    this.handlerPlayTracks = this.handlerPlayTracks.bind(this);
    this.handlerAddTrack = this.handlerAddTrack.bind(this);
  }

  componentDidMount() {
    this.props.search(`tracks?fi="meta.title"&q=`);
  }

  // Handler to add recursively all tracks on playlist.
  handlerPlayTracks(e, item) {
    if (e) e.stopPropagation();

    const { pause, onPlay, onPauseFunc, onPlayFunc } = this.props;

    if (onPlay.tracksId === item.tracksId) {
      if (pause) {
        return onPlayFunc();
      } else {
        return onPauseFunc();
      }
    }

    // Change global state to start playing track.
    this.props.readFile(item);
  }

  handlerAddTrack (e, tracksId) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const { addPlaylistItems, activePlaylist, user, history, location } = this.props;

    // User must be connected to add tracks.
    if (!user) return history.push({pathname: '/login', state: {from: location.pathname }});

    // Add tracks into activated Playlist.
    if (activePlaylist && tracksId) addPlaylistItems(activePlaylist.title, {tracks: [tracksId]});
  }

  render() {
    // const { nodes } = this.state;
    console.log('RENDER ALL TRACKS');
    const { onPlay, pause, data, total, search} = this.props;


    return (
      <section className='pal'>
        <h1>Tracks</h1><span>{total} tracks on result</span>
        <SearchMusicBar indexName='tracks'
                        field={'meta.title'}
                        filtersMapping={{
                          artist: 'meta.artist',
                          genre: 'meta.genre',
                          date: 'range.meta.year',
                          album: 'meta.album'
                        }}
                        startLimit={0}
                        searchAction={search}
                        placeholder='search tracks...'
        />

        <ul className='unstyled'>
          {
            data.map((item, i) => {

              let stateTrack = 'rien';
              if (onPlay.tracksId === item.tracksId) {
                stateTrack = 'play';
                if (pause) stateTrack = 'pause';
              }

              return (
                <li key={i}>
                  <a className='alltracks-item-album' href='#' onClick={(e) => this.handlerPlayTracks(e, item)} title={`Play ${item.meta.title}`}>
                    <span className='tracks-item-img'>
                      <Img title={`${item.meta.album} Cover`}
                           src={'/pictures/' + ps.changeSeparator(item.albumKey, '___', '/') + '/cover.jpg'}
                           defaultSrc={defaultCover}
                      />
                      {stateTrack === 'play' &&
                        <IconPlayAnim/>
                      }
                      {stateTrack === 'rien' &&
                        <i aria-hidden='true' className='icon icon-l icon-play'/>
                      }
                      {stateTrack === 'pause' &&
                        <i aria-hidden='true' className='icon icon-l icon-pause'/>
                      }
                    </span>

                    <span className='tracks-item-info'>
                      <span className='title'>{item.meta.title}</span>
                      <span className='artist'>{item.meta.artist}</span>
                      <span className='album'>{item.meta.artist}</span>
                      <span className='albumartist'>{item.meta.albumartist}</span>
                      <span className='track'>
                        <span className='trackno'>{item.meta.trackno}</span>/
                        <span className='trackof'>{item.meta.trackof}</span>
                      </span>
                      <span className='year'>{item.meta.year}</span>
                    </span>

                    <span className='tracks-item-menu'>
                      <button onClick={(e) => this.handlerAddTrack(e, item.tracksId)} className="btn btn-icon">
                        <i aria-hidden="true" className='icon icon-l icon-plus'/>
                      </button>
                    </span>
                  </a>
                </li>
              );
            })
          }
        </ul>
      </section>
    );
  }
}

const fetchActions = (props) => {
  return {
    search: props.search
  };
};

const AllTracksSplitFetchWrapped = splitFetchHOC(
  {size: 100, offset: 200},
  fetchActions
)(AllTracks);

const mapStateToProps = state => {
  return {
    user: state.authenticationStore._user,
    activePlaylist: state.playlistStore.activePlaylist,
    onPlay: state.playlistStore.onPlay,
    pause: state.playlistStore.pause
  }
};

const mapDispatchToProps = dispatch => {
  return {
    search: (query) => dispatch(
      get(`search/${query}&sort=meta.album`)
    ),
    readFile: (item) => dispatch(
      playItem(item)
    ),
    addPlaylistItems: (title, items) => dispatch(
      post(`playlist/${title}`, {
        data: items
      })
    ),
    onPauseFunc: () => dispatch(
      pauseState()
    ),
    onPlayFunc: () => dispatch(
      playState()
    )
  }
};

const AllTracksContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AllTracksSplitFetchWrapped);


export default AllTracksContainer
