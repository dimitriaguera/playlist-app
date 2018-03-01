import React, { Component } from 'react'
import { connect } from 'react-redux'
import debounce from 'lodash/debounce'
import { get } from 'core/client/services/core.api.services'
import SearchMusicBar from 'music/client/components/searchMusicBar/searchMusicBar.client.components'
import splitFetchHOC from 'lazy/client/components/lazy.client.splitFetchHOC'
import AlbumCard from 'music/client/components/album/albumCard.client.components'
import { Divider } from 'semantic-ui-react'

class Albums extends Component {
  constructor (props) {
    super(props);
    this.state = {
      card: {
        width: 150,
        height: 270,
        margin: 1,
        tabHeight: 500
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
    const nbPerRow = Math.floor(this.domElmt.getBoundingClientRect().width / totalCardWidth);

    this.setState({grid: {row: nbPerRow, width: nbPerRow * totalCardWidth}});
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
    const { card, grid } = this.state;

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
      <div ref={r => { this.domElmt = r }} style={{position: 'relative'}}>
        <h1>Albums</h1><span>{this.props.total} albums on result</span>
        <SearchMusicBar indexName='album'
          startLimit={0}
          searchAction={this.props.searchSized}
          filtersMapping={{artist: 'artist', genre: 'genre', date: 'range.year'}}
          placeholder='search album...'
        />
        <Divider />

        <div style={{position: 'relative'}}>
          {this.props.data.map((item, i) =>
            <AlbumCard key={item.key}
              index={i}
              album={item}
              card={card}
              grid={grid}
              wrapperStyle={cardDefaultStyle}
              innerStyle={innerStyle}
              imageStyle={imageStyle}
              hookOpenTab={this.hookOpenTab}
              hookCloseTab={this.hookCloseTab}
              history={this.props.history}
            />)}
        </div>
      </div>
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
