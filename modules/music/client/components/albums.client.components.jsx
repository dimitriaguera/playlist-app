import React, { Component } from 'react'
import { connect } from 'react-redux'
import debounce from 'lodash/debounce'
import { get } from 'core/client/services/core.api.services'
import { playItem, addAlbumToPlay, updateActivePlaylist } from 'music/client/redux/actions'
import SearchMusicBar from './searchMusicBar.client.components'
import splitFetchHOC from 'lazy/client/components/lazy.client.splitFetchHOC'
import AlbumTracks from 'music/client/components/albumTracks.client.components'
import ps from 'core/client/services/core.path.services'
import { Divider, Icon, Button } from 'semantic-ui-react'

import style from './style/albums.scss'

class Albums extends Component {

    constructor (props) {
        super(props);
        this.state = {
            openTab: {
                open: false
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
        this.handlerPlayAlbum = this.handlerPlayAlbum.bind(this);
        this.createInfoTab = this.createInfoTab.bind(this);

        this.onResizeHandle = debounce(this.onResizeHandle, 200);
    }

    componentDidMount() {
        window.addEventListener('resize', this.onResizeHandle);
        this.props.search(`album?sort=keyName&fi=name&q=`);
        this.setGrid();
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

        console.log(nbPerRow);

        this.setState({grid:{row:nbPerRow, width:nbPerRow*totalCardWidth}});
    }

    getRowNumber(index) {

        const rowLength = this.state.grid.row;

        return Math.ceil(index/rowLength);
    }

    // Handler to add recursively all tracks on playlist.
    handlerPlayAlbum( e, item ) {

        const _self = this;
        const {fetchFiles, addAlbumToPlay} = this.props;

        fetchFiles( ps.urlEncode(item.path) ).then((data) => {
            if ( !data.success ) {
                _self.setState({ error: true });
            }
            else {
                const album = {
                    pl: {
                        title: item.name,
                        path: item.path,
                        tracks: data.msg,
                    }
                };
                addAlbumToPlay( album );
            }
        });
    }

    createInfoTab(position, domElmt, album, promise) {

        const _self = this;
        const { openTab, grid, card, tab } = this.state;

        // If tab already open, check if same album.
        if(openTab.open && album.cover === openTab.album.cover) {

            // If same album tab open, close it.
            openTab.domElmt.card.style.height = card.height + 'px';
            openTab.domElmt.label.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';

            return this.setState({
                openTab: {domElmt: {card: null, label: null}, album: null, style: null, open: false}
            })
        }

        // Open tab without server resp.
        const rowNb = _self.getRowNumber(position);
        let style = {
            left: card.margin + 'px',
            top: (rowNb * (card.height + card.margin * 2)) + card.margin + 'px',
            width: (grid.width - (card.margin * 2)) + 'px',
        };

        if(openTab.domElmt && openTab.domElmt.card) {
            openTab.domElmt.card.style.height = card.height + 'px';
            openTab.domElmt.label.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        }

        domElmt.card.style.height = ( tab.defaultHeight + card.height + (card.margin * 2)) + 'px';
        domElmt.label.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';

        this.setState({
            openTab: {domElmt, album, style, open: true}
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
        const { user } = this.props;
        const { openTab, card } = this.state;

        const cardStyle = {
            width: card.width + 'px',
            height: card.height + 'px',
            margin: card.margin + 'px',
        };

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
                        <AlbumTracks key={item.cover}
                                     album={item}
                                     style={cardStyle}
                                     createInfoTab={this.createInfoTab.bind(null, (i+1))}
                        />)}


                    {openTab.open &&
                        <TrackList {...openTab} user={user}/>
                    }
                </div>
            </div>
        );
    }
}

const fetchActions = (props) => {
    return {
        search: props.search
    };
};

const AlbumsSplitFetchWrapped = splitFetchHOC(
    {size: 50, offset: 200},
    fetchActions
)(Albums);

const mapStateToProps = state => {
    return {
        user: state.authenticationStore._user,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        search: ( query ) => dispatch(
            get(`search/${query}`)
        ),
        fetchFiles: ( query ) => dispatch(
            get( `nodes/q/files?path=${query || ''}` )
        ),
        addAlbumToPlay: ( item ) => {
            // Search first track on list.
            const track = item.pl.tracks[0];
            // Add album to store.
            dispatch(addAlbumToPlay(item));
            // If track, play it.
            if( track ) dispatch(playItem( track ));
        },
    }
};

const AlbumsContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(AlbumsSplitFetchWrapped);


export default AlbumsContainer

const TrackList = ({ album, style, user, handlerPlayAlbum, handlerAddTracks }) => {

    return (
        <div className='album-tracks' style={style}>
            {
                album.tracks && album.tracks.map((item, i) => {
                    return (
                        <div key={i}>
                            <span className='fol-item-menu-inner'>
                                <Button size='mini' onClick={(e) => handlerPlayAlbum(e, i)} icon basic color="teal">
                                  <Icon name='play' />
                                </Button>
                                <Button size='mini' onClick={(e) => handlerAddTracks(e, item)} disabled={!user} icon basic color="teal">
                                  <Icon name='plus' />
                                </Button>
                            </span>
                            <span>
                                {item.meta.title}
                            </span>
                        </div>
                    )
                })
            }
        </div>
    );
};