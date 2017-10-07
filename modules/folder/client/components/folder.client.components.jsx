import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { List, Divider, Button, Icon, Breadcrumb, Segment, Label } from 'semantic-ui-react'
import { get, put } from 'core/client/services/core.api.services'
import { playItem, activatePlaylist } from 'music/client/redux/actions'
import SelectPlaylist from 'music/client/components/selectPlaylist.client.components'
import AddPlaylist from 'music/client/components/addPlaylist.client.components'

class Folder extends Component {

    constructor() {
        super();
        this.handlerOpenFolder = this.handlerOpenFolder.bind(this);
        this.handlerPrevFolder = this.handlerPrevFolder.bind(this);
        this.state = {
            path: [],
            folder: [],
            error: false,
        };
    }

    componentWillMount() {

        const _self = this;
        const { fetchFolder, location } = this.props;
        const params = new URLSearchParams(location.search);

        fetchFolder().then((data) => {
            if ( !data.success ) {
                _self.setState({ error: true, params: params });
            }
            else {
                _self.setState({
                    error: false,
                    folder: data.msg,
                    params: params,
                });
            }
        });
    }

    handlerOpenFolder( path ) {

        return (e) => {

            const _self = this;
            const {fetchFolder} = this.props;

            fetchFolder( buildPath(path) ).then((data) => {
                if ( !data.success ) {
                    _self.setState({ error: true });
                }
                else {
                    _self.setState({
                        error: false,
                        path: path,
                        folder: data.msg
                    });
                }
            });

            e.preventDefault();
        }
    }

    handlerPrevFolder(e) {

        const _self = this;
        const { fetchFolder } = this.props;
        const path = this.state.path.slice(0, -1);

        fetchFolder( buildPath(path) ).then((data) => {
            if ( !data.success ) {
                _self.setState({ error: true });
            }
            else {
                _self.setState({
                    error: false,
                    path: path,
                    folder: data.msg
                });
            }
        });

        e.preventDefault();
    }

    handlerReadFile( item, path ) {

        const play = {
            name: item.name,
            src: path,
        };

        return (e) => {
            this.props.readFile( play );
            e.preventDefault();
        }
    }

    handlerAddItem( item, path ) {

        const track = {
            name: item.name,
            src: path,
        };

        return (e) => {
            const pl = this.props.activePlaylist;
            const tracks = {
                tracks: [track]
            };

            this.props.addPlaylistItems( pl.title, tracks );
            e.preventDefault();
        }
    }

    render(){

        const { folder, path, error, params } = this.state;
        const { activePlaylist, history } = this.props;
        const bread = buildBread(path, this.handlerOpenFolder);

        const Bread = () => (
            <Breadcrumb divider='/' sections={bread} />
        );

        const folderList = folder.map( ( item, i )=> {

            if ( item === null ) return null;

            let nextPath = path.slice(0);
            nextPath.push(item.name);
            const stringPath = buildPath(nextPath);

            const handlerClick = item.isFile ?
                this.handlerReadFile( item, stringPath ) :
                this.handlerOpenFolder( nextPath );

            return (
                <FolderItemList key={i}
                                item={item}
                                path={stringPath}
                                activePl={!!activePlaylist}
                                onClick={handlerClick}
                                addItem={this.handlerAddItem(item, stringPath)}
                />
            );
        });

        return (
            <div>
                <h1>Browse Music</h1>
                <Divider/>

                {!activePlaylist && (
                <Segment>
                    <AddPlaylist history={history} />
                </Segment>
                )}

                <Segment>
                    <SelectPlaylist defaultValue={ params? params.get('pl') : null } />
                    {activePlaylist && <Label as={Link} to={`/playlist/${activePlaylist.title}`} color='teal' tag>{`${activePlaylist.tracks.length} tracks`}</Label>}
                </Segment>

                <Segment basic>
                    <Button circular size="small" color="grey" basic disabled={!path.length} onClick={this.handlerPrevFolder} icon>
                        <Icon name='arrow left' />
                    </Button>
                    <Bread/>
                </Segment>

                <List divided relaxed>
                    {!error ? folderList : `Can't read root folder`}
                </List>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        activePlaylist: state.playlistStore.activePlaylist,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        fetchFolder: ( query ) => dispatch(
            get( `folder?path=${query || ''}` )
        ),
        addPlaylistItems: ( title, items ) => dispatch(
            put( `addtracks/${title}`, {
                data: items,
                types: {
                    HOOK_TYPE: ( data ) => {
                        return dispatch => {
                            dispatch(activatePlaylist(data.msg))
                        }
                    },
                }
            } )
        ),
        readFile: ( item ) => dispatch(
            playItem( item )
        ),
    }
};

const FolderContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Folder);



const FolderItemList = ({ onClick, item, addItem, activePl }) => {

    return (
        <List.Item>
            {(item.isFile) && (
            <List.Content floated='right'>
                {activePl && <Button onClick={addItem} icon basic size="mini" color="teal">
                                <Icon name='plus' />
                            </Button>}
                {!activePl && <Link to='/'>Create playlist</Link>}
            </List.Content>
            )}
            <List.Icon name={item.isFile?'music':'folder'} verticalAlign='middle' />
            <List.Content onClick={onClick}>
                <List.Header as='a'>{item.name}</List.Header>
            </List.Content>
        </List.Item>
    );
};



// HELPER
function buildPath( array ){
    let path = '';
    for( let i=0; i<array.length; i++ ) {
        path += `/${array[i]}`;
    }
    return path;
}

function buildBread( array, handler ){

    const l = array.length - 1;

    return array.map( (item, i) => {

        const link = { key: item, content: item };

        if ( i !== l ) link.onClick = handler(array.slice(0, i + 1));
        else link.active = true;

        return link;
    });
}




export default FolderContainer