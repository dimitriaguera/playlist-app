import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'core/client/services/core.api.services'
import { playItem, addAlbumToPlay, updateActivePlaylist } from 'music/client/redux/actions'
import SearchMusicBar from './searchMusicBar.client.components'
import splitFetchHOC from 'lazy/client/components/lazy.client.splitFetchHOC'
import AlbumTracks from 'music/client/components/albumTracks.client.components'
import ps from 'core/client/services/core.path.services'
import { Divider, Icon } from 'semantic-ui-react'

import style from './style/albums.scss'

class Albums extends Component {

    constructor (props) {
        super(props);
        this.handlerPlayAlbum = this.handlerPlayAlbum.bind(this);
    }

    componentDidMount() {
        this.props.search(`album?fi=name&q=`);
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

    render(){

        //const { nodes } = this.state;

        return (
            <div>
                <h1>Albums</h1><span>{this.props.total} albums on result</span>
                <SearchMusicBar indexName='album'
                                startLimit={0}
                                searchAction={this.props.search}
                                filtersMapping={{artist:'artist', genre:'genre', date:'date'}}
                                placeholder='search album...'
                />
                <Divider/>
                {
                    this.props.data.map((item, i) => {
                        return (
                            <div className='albums-item-album' key={item.path + i}>
                                <div className='albums-item-img' onClick={(e) => this.handlerPlayAlbum(e, item)}>
                                    <img title="Album Cover" src={'pictures/' + item.path + 'cover.jpg'} width="150" height="150"></img>
                                    <Icon color='teal' circular inverted name='play'/>
                                </div>
                                <AlbumTracks album={item} className='albums-item-info'>
                                    <div className='name'>{item.name}</div>
                                    <div className='date'>{item.date}</div>
                                    <div className='artist'><span>{item.artist}</span></div>
                                </AlbumTracks>
                            </div>
                        );
                    })
                }
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