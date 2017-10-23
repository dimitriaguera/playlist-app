import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get, put } from 'core/client/services/core.api.services'
import { playOnPlaylist } from 'music/client/redux/actions'
import socketServices from 'core/client/services/core.socket.services'
import PlaylistItem from 'music/client/components/playlistItem.client.components'
import MenuEditPlaylist from 'music/client/components/menuEditPlaylist.client.components'
import { Item, Divider, Header, Segment } from 'semantic-ui-react'

import DraggableList from 'music/client/components/draggableList'

class Playlist extends Component {

    constructor( props ) {

        super( props );

        this.handlerSavePlaylist = this.handlerSavePlaylist.bind(this);

        this.socket = socketServices.getPublicSocket();
        this.state = {
        playlist: {
                title: '',
                tracks: [],
            },
        }
    }

    componentWillMount() {
        const _self = this;
        const title = _self.props.match.params.title;
        const { history } = _self.props;

        this.props.getPlaylist(title)
            .then( (data) => {
                if ( !data.success ) {

                    return history.push('/not-found');
                }
                _self.setState({
                    playlist: data.msg,
                })
            });

        this.socket.on('save:playlist', (data) => {
            if( this.state.playlist.title === data.title ) {
                _self.setState({ playlist: data })
            }
        });
    }

    componentWillUnmount() {
        this.socket.disconnect();
        console.log("Disconnecting Socket as component will unmount");
    }

    handlerReadFile( key ) {

        const { playlist } = this.state;

        return (e) => {

            this.props.readFile({
                pl: playlist,
                onPlayIndex: key,
            });
            e.preventDefault();
        }
    }

    handlerDelete( key ) {

        const title = this.props.match.params.title;

        return (e) => {

            const tracks = this.state.playlist.tracks;
            tracks.splice(key, 1);

            this.props.savePlaylist( title, tracks );
            e.preventDefault();
        }
    }

    handlerSavePlaylist( items ) {

        console.log('tracks sauvés : ', items);

        const { playlist } = this.state;
        this.props.savePlaylist( playlist.title, items );
    }

    render(){

        const { playlist } = this.state;
        const { history, playingList, isPaused } = this.props;
        const { onPlayIndex, pl } = playingList;
        const isActivePlaylist = pl && (pl.title === playlist.title);

        // const itemsList = playlist.tracks.map( (item, i) => {
        //     return <PlaylistItem
        //         key={i}
        //         item={item}
        //         index={i}
        //         isPaused={isPaused}
        //         active={isActivePlaylist && (i === onPlayIndex)}
        //         onDelete={this.handlerDelete(i)}
        //         onPlay={this.handlerReadFile(i)}
        //     />
        // });

        return (
            <div>
                <DraggableList items={playlist.tracks} callbackMouseUp={this.handlerSavePlaylist}/>
            {/*<div>*/}
                {/*<Header as='h3'>Playlist</Header>*/}
                {/*<MenuEditPlaylist history={history} target={playlist}/>*/}
                {/*<Header as='h1'>{playlist.title}</Header>*/}
                {/*<Divider/>*/}
                {/*<Segment basic>*/}
                    {/*<Item.Group divided verticalAlign='middle'>*/}
                        {/*{itemsList}*/}
                    {/*</Item.Group>*/}
                {/*</Segment>*/}
            {/*</div>*/}
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        playingList: state.playlistStore.playingList,
        isPaused: state.playlistStore.pause,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        getPlaylist: ( title ) => dispatch(
            get( `playlist/${title}` )
        ),
        readFile: ( item ) => dispatch(
            playOnPlaylist( item )
        ),
        savePlaylist: ( title, tracks ) => dispatch(
            put( `playlist/${title}`, {data:{tracks:tracks}} )
        )
    }
};

const PlaylistContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Playlist);

export default PlaylistContainer