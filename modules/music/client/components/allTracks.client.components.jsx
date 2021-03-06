import React, { Component } from 'react';
import { connect } from 'react-redux';
import { get } from 'core/client/services/core.api.services';
import { playOnTrack } from 'music/client/redux/actions';
import SearchMusicBar from 'music/client/components/searchMusicBar/searchMusicBar.client.components';
import Img from 'music/client/components/image/image.client.components';
import splitFetchHOC from 'lazy/client/components/lazy.client.splitFetchHOC';
import ps from 'core/client/services/core.path.services';
import IconPlayAnim from 'music/client/components/iconPlayAnim/iconPlayAnim.client.components';

import defaultCover from 'assets/images/default_cover.png';
import { post } from 'core/client/services/core.api.services';
import { pauseState, playState } from 'music/client/redux/actions';

class AllTracks extends Component {
  constructor(props) {
    super(props);

    this.handlerPlayTracks = this.handlerPlayTracks.bind(this);
    this.handlerAddTrack = this.handlerAddTrack.bind(this);
  }

  componentDidMount() {
    this.props.search(`tracks?fi="meta.title"&q=`);
  }

  toAlbumPage(e, key) {
    e.stopPropagation();
    e.preventDefault();

    this.props.history.push(`/album/${key}`);
  }

  // Handler to add recursively all tracks on playlist.
  handlerPlayTracks(e, item) {
    e.preventDefault();
    e.stopPropagation();

    const { pause, onPlay, onPauseFunc, onPlayFunc } = this.props;

    if (onPlay.tracksId === item.tracksId) {
      if (pause) {
        return onPlayFunc();
      } else {
        return onPauseFunc();
      }
    } else {
      // Change global state to start playing track.
      this.props.playOnTrack(item);
    }
  }

  handlerAddTrack(e, tracksId) {
    e.stopPropagation();
    e.preventDefault();

    const { addPlaylistItems, activePlaylist, user, history, location } = this.props;

    // User must be connected to add tracks.
    if (!user)
      return history.push({
        pathname: '/login',
        state: { from: location.pathname }
      });

    // Add tracks into activated Playlist.
    if (activePlaylist && tracksId)
      addPlaylistItems(activePlaylist.title, { tracks: [tracksId] });
  }

  render() {
    // const { nodes } = this.state;
    console.log('RENDER ALL TRACKS');
    const { onPlay, pause, data, total, search } = this.props;

    return (
      <section className="pal">
        <header>
          <h1>Tracks</h1>
          <span>{total} tracks on result</span>
          <SearchMusicBar
            indexName="tracks"
            field={'meta.title'}
            filtersMapping={{
              artist: 'meta.artist',
              genre: 'meta.genre',
              date: 'range.meta.year',
              album: 'meta.album'
            }}
            startLimit={0}
            searchAction={search}
            placeholder="search tracks..."
          />
        </header>
        <div className="content-wrapper center w-max-l">
          <div className="tracks-items-row-header">
            <span className="tracks-item-img"></span>
            <span className="title">Title</span>
            <span className="artist">Artist</span>
            <span className="album">Album</span>
            <span className="time">Time</span>
            <span className="tracks-item-menu">Add</span>
          </div>

          <ul className="unstyled">
            {data.map((item, i) => {
              let classLi = '';
              let stateTrack = 'rien';
              if (onPlay.tracksId === item.tracksId) {
                stateTrack = 'play';
                classLi = 'playing';
                if (pause) stateTrack = 'pause';
              }

              const artist = item.meta.artist
                ? item.meta.artist
                : item.meta.albumartist;

              return (
                <li key={i} className={classLi}>
                  <a
                    className="tracks-items-row"
                    href="#"
                    onClick={e => this.handlerPlayTracks(e, item)}
                    title={`Play ${item.meta.title}`}
                  >
                    <span className="tracks-item-img">
                      <Img
                        title={`${item.meta.album} Cover`}
                        src={
                          '/pictures/' +
                          ps.changeSeparator(item.albumKey, '___', '/') +
                          '/cover.jpg'
                        }
                        defaultSrc={defaultCover}
                      />
                      {stateTrack === 'play' && <IconPlayAnim />}
                      {stateTrack === 'rien' && (
                        <i aria-hidden="true" className="icon icon-l icon-play" />
                      )}
                      {stateTrack === 'pause' && (
                        <i aria-hidden="true" className="icon icon-l icon-pause" />
                      )}
                    </span>

                    <span className="title">{item.meta.title}</span>
                    {artist && <span className="artist">{artist}</span>}
                    {item.albumKey !== '' && item.meta.album && (
                      <button
                        onClick={e => this.toAlbumPage(e, item.albumKey)}
                        className="album"
                      >
                        {item.meta.album}
                      </button>
                    )}
                    {item.meta.time && (
                      <span className="time">{item.meta.time}</span>
                    )}
                    <span className="tracks-item-menu">
                      <button
                        onClick={e => this.handlerAddTrack(e, item.tracksId)}
                        className="btn btn-icon"
                      >
                        <i aria-hidden="true" className="icon icon-l icon-plus" />
                      </button>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    );
  }
}

const fetchActions = props => {
  return {
    search: props.search
  };
};

const AllTracksSplitFetchWrapped = splitFetchHOC(
  { size: 100, offset: 200 },
  fetchActions
)(AllTracks);

const mapStateToProps = state => {
  return {
    user: state.authenticationStore._user,
    activePlaylist: state.playlistStore.activePlaylist,
    onPlay: state.playlistStore.onPlay,
    pause: state.playlistStore.pause
  };
};

const mapDispatchToProps = dispatch => {
  return {
    search: query => dispatch(get(`search/${query}&sort=meta.album`)),
    addPlaylistItems: (title, items) =>
      dispatch(
        post(`playlist/${title}`, {
          data: items
        })
      ),
    onPauseFunc: () => dispatch(pauseState()),
    onPlayFunc: () => dispatch(playState()),
    playOnTrack: item => dispatch(playOnTrack(item))
  };
};

const AllTracksContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AllTracksSplitFetchWrapped);

export default AllTracksContainer;
