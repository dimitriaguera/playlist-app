import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'core/client/services/core.api.services'
import { playItem } from 'music/client/redux/actions'
import SearchMusicBar from 'music/client/components/searchMusicBar/searchMusicBar.client.components'
import Img from 'music/client/components/image/image.client.components'
import splitFetchHOC from 'lazy/client/components/lazy.client.splitFetchHOC'
import ps from 'core/client/services/core.path.services'
import { Divider } from 'semantic-ui-react'

import style from './style/allTracks.scss'
import defaultCover from 'assets/images/default_cover.png'

class AllTracks extends Component {
  constructor (props) {
    super(props);
    this.handlerPlayTracks = this.handlerPlayTracks.bind(this);
  }

  componentDidMount () {
    this.props.search(`tracks?fi="meta.title"&q=`);
  }

  // Handler to add recursively all tracks on playlist.
  handlerPlayTracks (e, item) {
    // Build track item.
    const play = item;

    // Change global state to start playing track.
    this.props.readFile(play);
    e.preventDefault();
  }

  render () {
    // const { nodes } = this.state;
    console.log('RENDER ALL TRACKS');

    return (
      <section>
        <h1>Tracks</h1><span>{this.props.total} tracks on result</span>
        <SearchMusicBar indexName='tracks'
          field={'meta.title'}
          filtersMapping={{artist: 'meta.artist', genre: 'meta.genre', date: 'range.meta.year', album: 'meta.album'}}
          startLimit={0}
          searchAction={this.props.search}
          placeholder='search tracks...'
        />
        <Divider />

        {
          this.props.data.map((item, i) => {
            return (
              <div className='alltracks-item-album' key={i}>
                <div className='tracks-item-img' onClick={(e) => this.handlerPlayTracks(e, item)}>
                  <Img title={`${item.meta.album} Cover`}
                    src={'/pictures/' + ps.changeSeparator(item.albumKey, '___', '/') + '/cover.jpg'}
                    defaultSrc={defaultCover}
                    width='50' height='50'
                  />
                  <i aria-hidden='true' className='icon icon-l white icon-play'/>
                </div>
                <div className='tracks-item-info'>
                  <div className='name'>{item.meta.title}</div>
                  <span className='artist'><span>{item.meta.artist}</span></span>
                  <span className='date'>{item.meta.date}</span>
                </div>
              </div>
            );
          })
        }
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
    user: state.authenticationStore._user
  }
};

const mapDispatchToProps = dispatch => {
  return {
    search: (query) => dispatch(
      get(`search/${query}&sort=meta.album`)
    ),
    readFile: (item) => dispatch(
      playItem(item)
    )
  }
};

const AllTracksContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AllTracksSplitFetchWrapped);


export default AllTracksContainer
