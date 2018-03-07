import React, { Component } from 'react'
import { connect } from 'react-redux'
import debounce from 'lodash/debounce'
import { get } from 'core/client/services/core.api.services'
import SearchMusicBar from 'music/client/components/searchMusicBar/searchMusicBar.client.components'
import splitFetchHOC from 'lazy/client/components/lazy.client.splitFetchHOC'
import AlbumCard from 'music/client/components/album/albumCard.client.components'
import { Divider } from 'semantic-ui-react'

const COVER_SIZE = 220;
const INFO_HEIGHT = 120;
const SPACE_BETWEEN = 1;
const TRACK_TAB_HEIGHT = 500;

class Albums extends Component {
  constructor (props) {
    super(props);
    this.state = {
      card: {
        width: COVER_SIZE,
        height: COVER_SIZE + INFO_HEIGHT,
        margin: SPACE_BETWEEN,
        infoHeight: INFO_HEIGHT,
        tabHeight: TRACK_TAB_HEIGHT
      },
      grid: {}
    };

    // Hook open/close album Tabs.
    this.closeLastTab = null;
    this.row = null;

    // Bind handler.
    this.onResizeHandle = this.onResizeHandle.bind(this);
    this.hookOpenTab = this.hookOpenTab.bind(this);
    this.hookCloseTab = this.hookCloseTab.bind(this);

    // Debounced hendlers.
    this.onResizeHandle = debounce(this.onResizeHandle, 200);
  }

  componentDidMount () {
    window.addEventListener('resize', this.onResizeHandle);
    this.props.searchSized(`album?sort=keyName&fi=name&q=`);
    this.setGrid();
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.onResizeHandle);
  }

  onResizeHandle () {
    this.setGrid();
  }

  setGrid () {
    const { card } = this.state;
    const totalCardWidth = card.width + (card.margin * 2);

    //@TODO timeout on mount because this.domElmt width is not good directly on mount. Because of media query that change layout dimension and mobile first approach.
    setTimeout(() => {
      const nbPerRow = Math.floor(this.domElmt.offsetWidth / totalCardWidth);
      this.setState({grid: {row: nbPerRow, width: nbPerRow * totalCardWidth}});
    }, 500);
  }

  hookOpenTab (func, row) {
    const sameRow = this.row === row;

    if (typeof this.closeLastTab === 'function') {
      this.closeLastTab();
    }

    this.closeLastTab = func;
    this.row = row;

    return sameRow;
  }

  hookCloseTab () {
    if (typeof this.closeLastTab === 'function') {
      this.closeLastTab();
    }
    this.closeLastTab = null;
    this.row = null;

    return false;
  }

  render () {
    const { card, grid, infoHeight, tabHeight } = this.state;

    // Build default card style.
    // Done here to avoid re-calculate this in each albumCard rendering.
    const cardDefaultStyle = {
      width: card.width + 'px',
      padding: card.margin + 'px'
    };

    // Build inner Card styles.
    // Done here to avoid re-calculate this in each albumCard rendering.
    const innerWidth = (card.width - (card.margin * 2));
    const innerStyle = {width: innerWidth, height: innerWidth};
    const imageStyle = {width: innerWidth + 'px', height: innerWidth + 'px'};

    console.log('RENDER ALL ALBUMS');

    return (
      <section>
        <h1>Albums</h1>
        <span>{this.props.total} albums on result</span>
        <SearchMusicBar indexName='album'
          startLimit={0}
          searchAction={this.props.searchSized}
          filtersMapping={{artist: 'artist', genre: 'genre', date: 'range.year'}}
          placeholder='search album...'
        />

        <div ref={r => { this.domElmt = r }} className='album-card-container' style={{width:'100%'}}>
          {this.props.data.map((item, i) =>
            <AlbumCard key={item.key}
              index={i}
              album={item}
              card={card}
              grid={grid}
               tabHeight={tabHeight}
               infoHeight={infoHeight}
              wrapperStyle={cardDefaultStyle}
              innerStyle={innerStyle}
              imageStyle={imageStyle}
              hookOpenTab={this.hookOpenTab}
              hookCloseTab={this.hookCloseTab}
              history={this.props.history}
              location={this.props.location}
            />)}
        </div>
      </section>
    );
  }
}

// SEARCH CONTAINER
const fetchActions = (props) => {
  return {
    searchSized: props.search
  };
};

const AlbumsSplitFetchWrapped = splitFetchHOC(
  {size: 50, offset: 200},
  fetchActions
)(Albums);

// REDUX CONNECT
const mapDispatchToProps = dispatch => {
  return {
    search: (query) => dispatch(
      get(`search/${query}`)
    ),
    fetchFiles: (query) => dispatch(
      get(`nodes/q/files?path=${query || ''}`)
    )
  }
};

const AlbumsContainer = connect(
  null,
  mapDispatchToProps
)(AlbumsSplitFetchWrapped);


export default AlbumsContainer
