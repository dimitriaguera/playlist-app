import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { List, Divider, Button, Icon, Breadcrumb, Segment, Label, Confirm } from 'semantic-ui-react'
import { get, put } from 'core/client/services/core.api.services'
import { playItem, addAlbumToPlay, updateActivePlaylist } from 'music/client/redux/actions'
import SelectPlaylist from 'music/client/components/selectPlaylist.client.components'
import AddPlaylist from 'music/client/components/addPlaylist.client.components'
import ps from 'folder/client/services/path.client.services'


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



class Folder extends Component {

    constructor() {
        super();
        this.handlerOpenFolder = this.handlerOpenFolder.bind(this);
        this.handlerPrevFolder = this.handlerPrevFolder.bind(this);

        this.handleOpen = this.handleOpen.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleConfirm = this.handleConfirm.bind(this);

        this.handlerGetDeepFiles = this.handlerGetDeepFiles.bind(this);
        this.handlerOpenFolder = this.handlerOpenFolder.bind(this);
        this.handlerPrevFolder = this.handlerPrevFolder.bind(this);
        this.handlerReadFile = this.handlerReadFile.bind(this);
        this.handlerAddItem = this.handlerAddItem.bind(this);
        this.handlerPlayAlbum = this.handlerPlayAlbum.bind(this);

        this.state = {
            path: [],
            folder: [],
            error: false,
            modal: {
                open: false,
                addTracks: [],
            },
        };
    }

    componentWillMount() {

        const _self = this;
        const { fetchFolder, location, match } = this.props;

        // TODO a simplifier. Sert à récupérer via url query la playlist à activer dès le cargement du component. Ne devrait pas être l'affaire de ce component.
        const params = new URLSearchParams(location.search);

        // Extract folder's path to url.
        const path = ps.cleanPath(ps.removeRoute( location.pathname, match.path ));

        // Get folder's content.
        fetchFolder( ps.urlEncode(path) ).then((data) => {
            if ( !data.success ) {
                _self.setState({ error: true, params: params });
            }
            else {
                _self.setState({
                    error: false,
                    folder: data.msg,
                    params: params,
                    path: ps.splitPath(path),
                });
            }
        });
    }

    // Re-render only if path array or modal state are modified.
    shouldComponentUpdate( nextState ) {
        const { path, modal } = nextState;
        return ( path !== this.state.path || modal !== this.state.modal );
    }

    // Force re-rendering on props location change.
    componentWillReceiveProps( nextProps ) {

        const _self = this;
        const { location, match } = nextProps;

        // Extract folder's path form url.
        const path = ps.cleanPath(ps.removeRoute( location.pathname, match.path ));

        // Query folder content, and set new state.
        // This start re-render component with folder content.
        this.props.fetchFolder( ps.urlEncode(path) ).then((data) => {
            if ( !data.success ) {
                _self.setState({ error: true });
            }
            else {
                _self.setState({
                    error: false,
                    folder: data.msg,
                    path: ps.splitPath(path),
                });
            }
        });
    }

    // Handle func when open Confirm Box.
    handleOpen( tracks ){
        this.setState({modal:{
            open:true,
            addTracks: tracks,
        }});
    }

    // Handle for cancel Confirm Box.
    handleCancel() {
        this.setState({modal:{
            open:false,
            addTracks: [],
        }});
    }

    // Handle for confirm Confirm Box.
    handleConfirm() {
        this.handlerAddItem(null, this.state.modal.addTracks);
        this.setState({modal:{
            open:false,
            addTracks: [],
        }});
    }

    // Handler to get all files recursively in a folder.
    handlerGetDeepFiles( e, path ) {
        const _self = this;
        const {fetchFiles} = this.props;

        fetchFiles( ps.urlEncode(path) ).then((data) => {
            if ( !data.success ) {
                _self.setState({ error: true });
            }
            else {
                this.handleOpen(data.msg);
            }
        });
        e.preventDefault();
    }

    // Handler onClick on a folder link.
    // Return list a folder content.
    handlerOpenFolder( path ) {

        const { history } = this.props;
        return (e) => {

            // Build path from array.
            const strPath = ps.buildPath(path);
            // Update component via url update.
            history.push(`/music${strPath}`);
            e.preventDefault();
        }
    }

    // Handler that return parent folder content.
    handlerPrevFolder( e ) {

        const { history } = this.props;
        // Delete last entry form path array.
        const path = this.state.path.slice(0, -1);
        // Build path from array.
        const strPath = ps.buildPath(path);
        // Update component via url update.
        history.push(`/music${strPath}`);
        e.preventDefault();
    }

    // Handler to play music file.
    handlerReadFile( e, item, path ) {

        // Build track item.
        const play = {
            name: item.name,
            src: path,
        };

        // Change global state to start playing track.
        this.props.readFile( play );
        e.preventDefault();
    }

    // Handler to add single track on playlist.
    handlerAddItem( e, item, path ) {

        const { user, history, activePlaylist, addPlaylistItems } = this.props;

        // User must be connected to add tracks.
        if ( !user ) return history.push('/login');

        // May be an array of several tracks.
        let tracks = item;

        // If just one item, build array with only one track.
        if ( !Array.isArray( tracks ) ) {
            tracks = [{
                name: item.publicName,
                src: path,
            }];
        }

        const data = {
            tracks: tracks
        };

        // Add tracks into activated Playlist.
        addPlaylistItems( activePlaylist.title, data );
        if( e ) e.preventDefault();
    }

    // Handler to add recursively all tracks on playlist.
    handlerPlayAlbum( e, item, path ) {

        const _self = this;
        const {fetchFiles, addAlbumToPlay} = this.props;

        fetchFiles( ps.urlEncode(path) ).then((data) => {
            if ( !data.success ) {
                _self.setState({ error: true });
            }
            else {
                const album = {
                    al: {
                        title: item.name,
                        path: path,
                        tracks: data.msg,
                    }
                };
                addAlbumToPlay( album );
            }
        });
    }

    render(){

        const { folder, path, error, params, modal } = this.state;
        const { activePlaylist, history, user } = this.props;

        const bread = buildBread(path, this.handlerOpenFolder);

        const Bread = () => (
            <Breadcrumb divider='/' sections={bread} />
        );

        const folderList = folder.map( ( item, i )=> {

            // If item phantom, no render and next entry.
            if ( item === null ) return null;

            const arrayPath = path.slice(0);
            arrayPath.push(item.name);
            const stringPath = ps.buildPath(arrayPath);

            // Set handler to use on file link click.
            // If item is a folder, fetch and display content.
            // If item is a file, start playing track.
            let handlerClick = () => {
                if ( item.isFile ) {
                    return (e) => this.handlerReadFile(e, item, stringPath);
                }
                else {
                    return this.handlerOpenFolder(arrayPath);
                }
            };

            return (
                <FolderItemList key={i}
                                item={item}
                                user={user}
                                path={stringPath}
                                activePl={!!activePlaylist}
                                onClick={handlerClick(arrayPath)}
                                onGetFiles={(e) => this.handlerGetDeepFiles(e, stringPath)}
                                onAddItem={(e) => this.handlerAddItem(e, item, stringPath)}
                                onPlayAlbum={(e) => this.handlerPlayAlbum(e, item, stringPath)}
                />
            );
        });

        console.log('RENDER FOLDER');

        return (
            <div>
                <h1>Music</h1>
                <Divider/>

                {!activePlaylist && (
                <Segment>
                    <AddPlaylist history={history} />
                </Segment>
                )}

                {user && (
                    <Segment>
                        <SelectPlaylist defaultValue={ params ? params.get('pl') : null }/>
                        {activePlaylist && <Label as={Link} to={`/playlist/${activePlaylist.title}`} color='teal'
                                                  tag>{`${activePlaylist.tracks.length} tracks`}</Label>}
                    </Segment>
                )}

                <Segment basic>
                    <Button circular size="small" color="grey" basic disabled={!path.length} onClick={this.handlerPrevFolder} icon>
                        <Icon name='arrow left' />
                    </Button>
                    <Bread/>
                </Segment>

                <Segment>
                    <List divided relaxed='very' size='large' verticalAlign='middle'>
                        {!error ? folderList : `Can't read ${this.state.path[this.state.path.length - 1] || 'root folder.'}`}
                    </List>
                </Segment>
                <Confirm
                    open={ modal.open }
                    onCancel={ this.handleCancel }
                    onConfirm={ this.handleConfirm }
                    content={`Add ${modal.addTracks.length} tracks on playlist ?`}
                />
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        activePlaylist: state.playlistStore.activePlaylist,
        playingList: state.playlistStore.playingList,
        user: state.authenticationStore._user,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        fetchFolder: ( query ) => dispatch(
            get( `folder?path=${query || ''}` )
        ),

        fetchFiles: ( query ) => dispatch(
            get( `files?path=${query || ''}` )
        ),

        addPlaylistItems: ( title, items ) => dispatch(
            put( `addtracks/${title}`, {
                data: items,
                types: {
                    HOOK_TYPE: ( data ) => {
                        return dispatch => {
                            dispatch(updateActivePlaylist(data.msg))
                        }
                    },
                }
            } )
        ),

        addAlbumToPlay: ( item ) => {
            // Search first track on list.
            const track = item.al.tracks[0];
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

const FolderContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Folder);



const FolderItemList = ({ onClick, onGetFiles, onPlayAlbum, item, user, onAddItem, activePl }) => {

    const name = item.publicName || item.name;

    return (
        <List.Item>
            {(item.isFile) && (
            <List.Content floated='right'>
                {activePl && <Button onClick={onAddItem} disabled={!user} icon basic size="mini" color="teal">
                                <Icon name='plus' />
                            </Button>}
                {!activePl && <Link to='/'>Create playlist</Link>}
            </List.Content>
            )}

            {(!item.isFile) && (
            <List.Content floated='right'>
                <Button onClick={onPlayAlbum} icon basic size="mini" color="teal">
                    <Icon name='play' />
                </Button>
                <Button onClick={onGetFiles} disabled={!user} icon basic size="mini" color="teal">
                    <Icon name='plus' />
                </Button>
            </List.Content>
            )}

            <List.Icon name={item.isFile?'music':'folder'} />
            <List.Content onClick={onClick}>
                <List.Header as='a'>{name}</List.Header>
            </List.Content>
        </List.Item>
    );
};


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

export default FolderContainer