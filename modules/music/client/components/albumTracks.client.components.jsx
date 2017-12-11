import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'core/client/services/core.api.services'
import { playItem, addAlbumToPlay, updateActivePlaylist } from 'music/client/redux/actions'
import ps from 'folder/client/services/path.client.services'
import { Divider, Icon } from 'semantic-ui-react'

import style from './style/albumTracks.scss'

class AlbumTracks extends Component {

    constructor(props){
        super(props);

        this.handlerOpenAlbum = this.handlerOpenAlbum.bind(this);

        this.state = {
            album: props.album,
            tracks: [],
            open: false,
        };
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

    handlerOpenAlbum(e) {

        const _self = this;
        const { search, album } = this.props;

        search(`tracks?fi=meta.album&q="${album}"&exact=true`)
            .then((data) => {
                if(data.success){
                    const docs = data.msg.hits.hits;
                    const tracks = docs.map((item) => item._source);
                    _self.setState({tracks:tracks, open:true});
                }
            });
    }

    render(){

        const { className } = this.props;
        const { tracks } = this.state;

        return (
            <div className={className} onClick={this.handlerOpenAlbum}>
                {this.props.children}
                <div className='album-tracks'>
                {
                    tracks.map((item, i) => {
                        return <div key={i}>{item.meta.title}</div>
                    })
                }
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {

    }
};

const mapDispatchToProps = dispatch => {
    return {
        search: ( query ) => dispatch(
            get(`search/${query}`)
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

const AlbumTracksContainer = connect(
    null,
    mapDispatchToProps
)(AlbumTracks);


export default AlbumTracksContainer