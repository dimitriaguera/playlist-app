import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Divider, Button, Modal, Icon, Segment, Label, Step, Header } from 'semantic-ui-react'
import { get, post } from 'core/client/services/core.api.services'
import { playItem, addAlbumToPlay, updateActivePlaylist } from 'music/client/redux/actions'
import TransitionList from 'transitionList/client/components/transitionList'
import IndexableFolderItem from './indexableFolderItem.client.components'
import SearchFolderBar from './SearchFolderBar.client.components'
import SelectPlaylist from 'music/client/components/selectPlaylist.client.components'
import ps from 'core/client/services/core.path.services'

/**
 * Folder is the file explorator component.
 * The folder's path to open is get with component URL, via react-router v4.
 *
 * For example :
 * ----> http://my.example.com/music/Brassens
 * will call component to display /Brassens folder's content.
 * ----> http://my.example.com/music/amy_winhouse/bestOf/theBest
 * will call component to display /amy_winhouse/bestOf/theBest folder's content.
 *
 */



class IndexableFolder extends Component {

    constructor() {
        super();

        this.handleModalOpen = this.handleModalOpen.bind(this);
        this.handleModalCancel = this.handleModalCancel.bind(this);
        this.handleModalConfirm = this.handleModalConfirm.bind(this);
        this.handlerGetAllFiles = this.handlerGetAllFiles.bind(this);
        this.handlerOpenFolder = this.handlerOpenFolder.bind(this);
        this.handlerRootFolder = this.handlerRootFolder.bind(this);
        this.handlerReadFile = this.handlerReadFile.bind(this);
        this.handlerAddItem = this.handlerAddItem.bind(this);
        this.handlerPlayAlbum = this.handlerPlayAlbum.bind(this);
        this.onListTracks = this.onListTracks.bind(this);
        this.handlerClickOnFile = this.handlerClickOnFile.bind(this);

        this.state = {
            path: [],
            query: null,
            search: null,
            nodes: [],
            error: false,
            modal: {
                open: false,
                addTracks: [],
            },
        };
    }

    componentWillMount() {

        const _self = this;
        const { fetchFolder, searchNodes, location, match } = this.props;

        // TODO a simplifier. Sert à récupérer via url query la playlist à activer dès le chargement du component. Ne devrait pas être l'affaire de ce component.
        const params = new URLSearchParams(location.search.substring(1));
        const term = params.get('search');

        // If search param, only display result.
        if( term ) {
            return searchNodes( term ).then((data) => {
                if ( !data.success ) {
                    _self.setState({ error: true, params: params });
                }
                else {
                    const nodes = data.msg.hits.hits.map((item) => item._source);
                    _self.setState({
                        error: false,
                        nodes: nodes,
                        search: term,
                        params: params,
                    });
                }
            });
        }

        // Extract folder's path to url.
        const path = ps.cleanPath(ps.removeRoute( location.pathname, match.path ));

        // Get folder's content.
        return fetchFolder( ps.urlEncode(path) ).then((data) => {
            if ( !data.success ) {
                _self.setState({ error: true, params: params });
            }
            else {
                _self.setState({
                    error: false,
                    nodes: data.msg,
                    params: params,
                    query: path,
                    path: ps.splitPath(path),
                });
            }
        });
    }

    // Re-render only if path array or modal state are modified.
    shouldComponentUpdate( nextProps, nextState ) {
        const { activePlaylist } = nextProps;
        const { query, modal, nodes } = nextState;
        return (
            query !== this.state.query ||
            modal !== this.state.modal ||
            nodes !== this.state.nodes ||
            activePlaylist !== this.props.activePlaylist );
    }

    // Force re-rendering on props location change.
    componentWillReceiveProps( nextProps ) {

        const _self = this;
        const { location, match } = nextProps;

        // TODO a simplifier. Sert à récupérer via url query la playlist à activer dès le chargement du component. Ne devrait pas être l'affaire de ce component.
        const params = new URLSearchParams(location.search.substring(1));
        const term = params.get('search');

        // If search param, only display result.
        if( term && term !== this.state.search ) {
            return this.props.searchNodes( term ).then((data) => {
                if ( !data.success ) {
                    _self.setState({ error: true, params: params });
                }
                else {
                    const nodes = data.msg.hits.hits.map((item) => item._source);
                    _self.setState({
                        error: false,
                        nodes: nodes,
                        query: null,
                        search: term,
                        params: params,
                    });
                }
            });
        }

        // Extract folder's path form url.
        const path = ps.cleanPath(ps.removeRoute( location.pathname, match.path ));

        console.log('PATH: ', path);

        if( path !== this.state.query ) {
            // Query folder content, and set new state.
            // This start re-render component with folder content.
            this.props.fetchFolder(ps.urlEncode(path)).then((data) => {
                if (!data.success) {
                    _self.setState({error: true});
                }
                else {
                    _self.setState({
                        error: false,
                        nodes: data.msg,
                        query: path,
                        search: null,
                        path: ps.splitPath(path),
                    });
                }
            });
        }
    }

    // Handle func when open Confirm Box.
    handleModalOpen( tracks ){
        this.setState({modal:{
            open:true,
            addTracks: tracks,
        }});
    }

    // Handle for cancel Confirm Box.
    handleModalCancel() {
        this.setState({modal:{
            open:false,
            addTracks: [],
        }});
    }

    // Handle for confirm Confirm Box.
    handleModalConfirm() {
        const tracks = this.state.modal.addTracks.map((file) => {
                return file._id
        });

        this.handlerAddItem(null, tracks);
        this.setState({modal:{
            open:false,
            addTracks: [],
        }});
    }

    // Handler to get all files recursively in a folder.
    handlerGetAllFiles( e, item ) {
        const _self = this;
        const {fetchFiles} = this.props;

        fetchFiles( ps.urlEncode(item.path) ).then((data) => {
            if ( !data.success ) {
                _self.setState({ error: true });
            }
            else {
                this.handleModalOpen(data.msg);
            }
        });
        e.preventDefault();
    }

    // Handler onClick on a folder link.
    // Return list a folder content.
    handlerOpenFolder( e, path ) {

        const { history } = this.props;

        // Update component via url update.
        history.push(`/indexMusic/${path}`);
        e.preventDefault();
    }

    // Handler that return root folder content.
    handlerRootFolder( e ) {

        const { history } = this.props;

        // Update component via url update.
        history.push(`/indexMusic`);
        e.preventDefault();
    }

    // Handler to looks at files as tracks list.
    onListTracks(e, item) {
        const { history } = this.props;

        // Go to album display mode.
        history.push(`/album${item.path}`);
        e.preventDefault();
    }

    // Handler to play music file.
    handlerReadFile( e, item ) {

        // Build track item.
        const play = item;

        // Change global state to start playing track.
        this.props.readFile( play );
        e.preventDefault();
    }

    // Handler to add single track on playlist.
    handlerAddItem( e, item ) {

        const { user, history, activePlaylist, addPlaylistItems } = this.props;

        // User must be connected to add tracks.
        if ( !user ) return history.push('/login');

        // May be an array of several tracks.
        let tracks = item;

        // If just one item, build array with only one track.
        if ( !Array.isArray( tracks ) ) {
            tracks = [item._id];
        }

        const data = {
            tracks: tracks
        };

        // Add tracks into activated Playlist.
        addPlaylistItems( activePlaylist.title, data );
        if( e ) e.preventDefault();
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

    // Click on folder or file element.
    handlerClickOnFile(e, item) {

        if( item.isFile ) {
            return this.handlerReadFile(e, item);
        }

        this.handlerOpenFolder(e, item.path);
    }


    render(){

        const { nodes, path, error, params, modal } = this.state;
        const { activePlaylist, user } = this.props;

        let activePlaylistTitle = '';
        let pathUrl = '';

        if( activePlaylist ) {
            if( activePlaylist.defaultPlaylist ) {
                activePlaylistTitle = activePlaylist.publicTitle;
                pathUrl = '/queue'
            }
            else {
                activePlaylistTitle = activePlaylist.title;
                pathUrl = `/playlist/${activePlaylist.title}`;
            }
        }

        return (
            <div>
                <h1>Music Folders</h1>
                <Divider/>

                <Segment>
                    <SearchFolderBar handlerResult={result => this.setState({nodes: result})} />
                </Segment>

                {user && (
                    <Segment>
                        <Header icon='pencil' content='Editing playlist' />
                        <SelectPlaylist defaultValue={ params ? params.get('pl') : null }/>
                        {activePlaylist && <Label as={Link} to={pathUrl} color='teal'
                                                  tag>{`${activePlaylist.length} tracks`}</Label>}
                    </Segment>
                )}

                <Bread path={path} handlerOpenFolder={this.handlerOpenFolder} handlerRootFolder={this.handlerRootFolder} />

                {(!error) &&
                    nodes.map((item, i) => {
                        return (
                            <IndexableFolderItem
                                key={i}
                                item={item}
                                user={user}
                                onClick={this.handlerClickOnFile}
                                onGetFiles={this.handlerGetAllFiles}
                                onAddItem={this.handlerAddItem}
                                onPlayAlbum={this.handlerPlayAlbum}
                                onListTracks={this.onListTracks}
                            />
                        )
                    })
                 }


                <Modal
                    open={ modal.open }
                    onClose={ this.handleModalCancel }
                    basic
                    size='small'
                >
                    <Header icon='pencil' content={`Add ${modal.addTracks.length} tracks ?`} />
                    <Modal.Content>
                        <p>{`Do you want to add all those tracks on ${activePlaylistTitle} playlist ?`}</p>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button inverted onClick={ this.handleModalCancel }>
                            <Icon name='remove' /> No
                        </Button>
                        <Button color='teal' inverted onClick={ this.handleModalConfirm }>
                            <Icon name='checkmark' /> Yes
                        </Button>
                    </Modal.Actions>
                </Modal>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        activePlaylist: state.playlistStore.activePlaylist,
        user: state.authenticationStore._user,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        fetchFolder: ( query ) => dispatch(
            get( `nodes/q/child?path=${query || ''}` )
        ),

        searchNodes: ( query ) => dispatch(
            get( `search/album?search=${query || ''}` )
        ),

        fetchFiles: ( query ) => dispatch(
            get( `nodes/q/files?path=${query || ''}` )
        ),

        addPlaylistItems: ( title, items ) => dispatch(
            post( `playlist/${title}`, {
                data: items,
                // types: {
                //     HOOK_TYPE: ( data ) => {
                //         return dispatch => {
                //             dispatch(updateActivePlaylist(data.msg))
                //         }
                //     },
                // }
            } )
        ),

        addAlbumToPlay: ( item ) => {
            // Search first track on list.
            const track = item.pl.tracks[0];
            // Add album to store.
            dispatch(addAlbumToPlay(item));
            // If track, play it.
            if( track ) dispatch(playItem( track ));
        },

        readFile: ( item ) => dispatch(
            playItem( item )
        ),
    }
};

const IndexableFolderContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(IndexableFolder);


function Bread({ path, handlerOpenFolder, handlerRootFolder }) {

    const stepWidth = `calc(${100/path.length}% - ${(70 / path.length)}px)`;

    return(
        <Step.Group size='mini' unstackable>
            <Step link onClick={handlerRootFolder} style={{maxWidth:'70px'}}>
                <Step.Content>
                    <Step.Title><Icon name='home' size='large' /></Step.Title>
                </Step.Content>
            </Step>
            {path.map( (item, i) => {
                return (
                    <Step link key={i} active={i === path.length - 1} onClick={(e) => handlerOpenFolder(e, ps.buildPath(path.slice(0, i + 1)))} style={{maxWidth:stepWidth}}>
                        <Step.Content>
                            <Step.Title>{item}</Step.Title>
                        </Step.Content>
                    </Step>
                );
            })}
        </Step.Group>
    )
}

// HELPER
// Return Array to feed Breadcrumb Semantic UI React Component.
function buildBread( array, handler ){

    const l = array.length - 1;

    return array.map( (item, i) => {

        const link = { key: i, content: item };

        if ( i !== l ) link.onClick = handler(array.slice(0, i + 1));
        else link.active = true;

        return link;
    });
}

export default IndexableFolderContainer