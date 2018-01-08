import React, { Component } from 'react'
import { connect } from 'react-redux'
import debounce from 'lodash/debounce'
import { get } from 'core/client/services/core.api.services'
import SearchMusicBar from './searchMusicBar.client.components'
import splitFetchHOC from 'lazy/client/components/lazy.client.splitFetchHOC'
import AlbumCard from 'music/client/components/albumCard.client.components'
import AlbumTracks from 'music/client/components/albumTracks.client.components'
import { Divider } from 'semantic-ui-react'

class Albums extends Component {

    constructor (props) {
        super(props);
        this.state = {
            openTab: {
                open: false,
                style: {},
            },
            tab: {
                lineHeight: 40,
                padding: 20,
                defaultHeight: 500,
            },
            card: {
                width: 150,
                height: 270,
                margin: 1,
            },
            grid: {}
        };

        this.onResizeHandle = this.onResizeHandle.bind(this);
        this.createInfoTab = this.createInfoTab.bind(this);
        // this.search = this.search.bind(this);

        this.onResizeHandle = debounce(this.onResizeHandle, 200);
    }

    componentDidMount() {
        window.addEventListener('resize', this.onResizeHandle);
        this.props.search(`album?sort=keyName&fi=name&q=`);
        this.setGrid();
    }

    componentWillUpdate(nextProps) {
        if( nextProps.data !== this.props.data ){
            this.closeInfoTab();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onResizeHandle);
    }

    onResizeHandle() {
        this.setGrid();
    }

    setGrid() {
        const { card } = this.state;
        const totalCardWidth = card.width+(card.margin*2);
        const nbPerRow = Math.floor(this.domElmt.getBoundingClientRect().width / totalCardWidth);

        this.setState({grid:{row:nbPerRow, width:nbPerRow*totalCardWidth}});
    }

    getRowNumber(index) {
        const rowLength = this.state.grid.row;

        return Math.ceil(index/rowLength);
    }

    // search(query) {
    //     this.closeInfoTab();
    //     this.props.search(query);
    // }

    closeInfoTab() {
        const { openTab, card } = this.state;

        if(openTab.open) {
            closeCard(openTab.domElmt, card.height, true);
            this.setState({
                openTab: {domElmt: {card: null, label: null}, album: null, style: null, open: false}
            });
        }
    }

    createInfoTab(position, domElmt, album, promise) {
        const _self = this;
        const { openTab, card, tab } = this.state;

        // If clicked tab already open, close it.
        if(openTab.open && album.key === openTab.album.key) {

            closeCard(openTab.domElmt, card.height, true);

            return this.setState({
                openTab: {domElmt: {card: null, label: null}, album: null, style: null, open: false}
            });
        }

        // Open tab without server resp.
        const row = _self.getRowNumber(position);
        // Check if same row, to add or cancel card height anim.
        const transition = !( openTab.row && row === openTab.row );

        // Style to apply to tracks tab.
        let style = {
            left: card.margin + 'px',
            top: (row * (card.height + card.margin * 2)) + card.margin + 'px',
        };

        // Reset class an style to previous opened card.
        if(openTab.domElmt && openTab.domElmt.card) {
            closeCard(openTab.domElmt, card.height, transition);
        }

        // Set class and style to opened card.
        openCard(domElmt, tab.defaultHeight + card.height + (card.margin * 2), transition);

        // Save new opened card in state.
        this.setState({
            openTab: {domElmt, album, style, row:row , open: true}
        });

        // When server rep, new traitment.
        promise.then(album => {
            // const newHeight = Math.max( ((album.tracks.length * tab.lineHeight) + card.height + (tab.padding * 2)), (tab.defaultHeight + card.height) );
            // domElmt.card.style.height = newHeight + 'px';
            _self.setState({
                openTab: Object.assign(_self.state.openTab, {album: album}),
            });
        });
    }

    render(){
        const { openTab, card, grid } = this.state;

        const cardDefaultStyle = {
            width: card.width + 'px',
            height: card.height + 'px',
            margin: card.margin + 'px',
        };

        // No mutate openTab.
        const tabProps = Object.assign({}, openTab);
        // No mutate style.
        tabProps.style = Object.assign({}, tabProps.style, {width: (grid.width - (card.margin * 2)) + 'px'});

        console.log('RENDER ALL ALBUMS');

        return (
            <div ref={r => {this.domElmt = r}} style={{position:'relative'}}>
                <h1>Albums</h1><span>{this.props.total} albums on result</span>
                <SearchMusicBar indexName='album'
                                startLimit={0}
                                searchAction={this.props.search}
                                filtersMapping={{artist:'artist', genre:'genre', date:'range.year'}}
                                placeholder='search album...'
                />
                <Divider/>

                <div style={{position:'relative'}}>
                    {this.props.data.map((item, i) =>
                        <AlbumCard key={item.key}
                                     album={item}
                                     style={cardDefaultStyle}
                                     createInfoTab={this.createInfoTab.bind(null, (i+1))}
                        />)}


                    {openTab.open &&
                        <AlbumTracks {...tabProps}/>
                    }
                </div>
            </div>
        );
    }
}

// HELPER
function closeCard( domElmt, height, transition ) {
    domElmt.card.classList.remove('open');
    domElmt.card.style.zIndex = '1';
    domElmt.card.style.height = height + 'px';
    domElmt.card.style.transition = transition ? 'height 0.3s' : '';
}

function openCard( domElmt, height, transition ) {
    domElmt.card.classList.add('open');
    domElmt.card.style.zIndex = '2';
    domElmt.card.style.height = height + 'px';
    domElmt.card.style.transition = transition ? 'height 0.3s' : '';
}

// SEARCH CONTAINER
const fetchActions = (props) => {
    return {
        search: props.search
    };
};

const AlbumsSplitFetchWrapped = splitFetchHOC(
    {size: 50, offset: 200},
    fetchActions
)(Albums);

// REDUX CONNECT
const mapDispatchToProps = dispatch => {
    return {
        search: ( query ) => dispatch(
            get(`search/${query}`)
        ),
        fetchFiles: ( query ) => dispatch(
            get( `nodes/q/files?path=${query || ''}` )
        ),
    }
};

const AlbumsContainer = connect(
    null,
    mapDispatchToProps
)(AlbumsSplitFetchWrapped);


export default AlbumsContainer