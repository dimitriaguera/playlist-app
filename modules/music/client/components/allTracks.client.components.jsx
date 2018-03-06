import React, {Component} from 'react'
import {connect} from 'react-redux'
import {get} from 'core/client/services/core.api.services'
import {playItem} from 'music/client/redux/actions'
import SearchMusicBar from 'music/client/components/searchMusicBar/searchMusicBar.client.components'
import Img from 'music/client/components/image/image.client.components'
import splitFetchHOC from 'lazy/client/components/lazy.client.splitFetchHOC'
import ps from 'core/client/services/core.path.services'
import {Divider} from 'semantic-ui-react'

import defaultCover from 'assets/images/default_cover.png'
import {post} from "../../../core/client/services/core.api.services";

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
    // Build track item.
    const play = item;

    // Change global state to start playing track.
    this.props.readFile(play);
    e.preventDefault();
  }

  handlerAddTrack (e, tracksId) {
    const { addPlaylistItems, activePlaylist, user } = this.props;

    // User must be connected to add tracks.
    if (!user) return history.push('/login');

    // Add tracks into activated Playlist.
    addPlaylistItems(activePlaylist.title, {tracks: [tracksId]});
    if (e) e.preventDefault();
  }


  render() {
    // const { nodes } = this.state;
    console.log('RENDER ALL TRACKS');

    return (
      <section>
        <h1>Tracks</h1><span>{this.props.total} tracks on result</span>
        <SearchMusicBar indexName='tracks'
                        field={'meta.title'}
                        filtersMapping={{
                          artist: 'meta.artist',
                          genre: 'meta.genre',
                          date: 'range.meta.year',
                          album: 'meta.album'
                        }}
                        startLimit={0}
                        searchAction={this.props.search}
                        placeholder='search tracks...'
        />

        <ul className='unstyled'>
          {
            this.props.data.map((item, i) => {
              return (
                <li key={i}>
                  <a className='alltracks-item-album' href='#' onClick={(e) => this.handlerPlayTracks(e, item)} title={`Play ${item.meta.title}`}>
                    <span className='tracks-item-img'>
                      <Img title={`${item.meta.album} Cover`}
                           src={'/pictures/' + ps.changeSeparator(item.albumKey, '___', '/') + '/cover.jpg'}
                           defaultSrc={defaultCover}
                      />
                      <i aria-hidden='true' className='icon icon-l icon-play'/>
                    </span>

                    <span className='tracks-item-info'>
                      <span className='name'>{item.meta.title}</span>
                      <span className='artist'>{item.meta.artist}</span>
                      <span className='album'>{item.meta.artist}</span>
                      <span className='date'>{item.meta.date}</span>
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
    onPlay: state.playlistStore.onPlay,
    onPlayIndex: state.playlistStore.playingList.onPlayIndex,
    mode: state.playlistStore.mode,
    activePlaylist: state.playlistStore.activePlaylist
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
    )
  }
};

const AllTracksContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AllTracksSplitFetchWrapped);


export default AllTracksContainer
