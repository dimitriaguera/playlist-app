import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { get, post } from 'core/client/services/core.api.services'
import socketServices from 'core/client/services/core.socket.services'
import MenuPlay from './menuPlay.client.components'
import AddPlaylist from './addPlaylist.client.components'
import { Divider, Card, Segment, Responsive, Icon, Image, Grid } from 'semantic-ui-react'

class AllPlaylist extends Component {

    constructor( props ) {
        super( props );
        this.socket = socketServices.getPublicSocket();
        this.state = {
            allPlaylist: [],
        }
    }

    componentWillMount() {
        const _self = this;
        const { user } = this.props;
        const username = user ? user.username : '';

        // Get all playlist.
        this.props.getAllPlaylist()
            .then( (data) => {
                if( data.success ){
                    _self.setState({ allPlaylist: data.msg });
                }
            });

        // Socket connexion.
        this.socket.on('save:playlist', (data) => {
            const apl = updateAllPlaylist( _self.state.allPlaylist, data );
            _self.setState({ allPlaylist: apl })
        });
    }

    // Update Playlists list if user connexion move.
    componentWillReceiveProps( nextProps ) {

        if( this.props.user !== nextProps.user ){

            const _self = this;

            // If user connected, get all with default playlist.
            if( nextProps.user ) {
                console.log('UPDATE DPL');
                this.props.getAllPlaylist()
                    .then( (data) => {
                        if( data.success ){
                            _self.setState({ allPlaylist: data.msg });
                        }
                    });
            }

            // No user, delete default playlist.
            else {
                const apl = deleteDefaultPlaylist( _self.state.allPlaylist );
                _self.setState({ allPlaylist: apl });
            }
        }
    }


    // On unmount component, disconnect Socket.io.
    componentWillUnmount() {
        this.socket.disconnect();
        console.log("Disconnecting Socket as component will unmount");
    }

    render(){

        const { allPlaylist } = this.state;
        const { history } = this.props;

        const getAuthor = function( item ) {
            if ( !item.author ) {
                return 'Created by anonyme';
            }
            else {
                return `Created by ${item.author.username}`;
            }
        };

        const playLists = allPlaylist.map( (item, i) => {
            return (
                <Grid.Column key={i}>
                    <Card>
                        {/*<Image src='/static/images/test.jpg' />*/}
                        <Card.Content>
                            <Card.Header as={Link} to={`/playlist/${item.title}`}>
                                {item.title}
                            </Card.Header>
                            <Card.Meta>{getAuthor(item)}</Card.Meta>
                            <Link as='a' to={`/music?pl=${item.title}`}>+ add tracks</Link>
                        </Card.Content>
                        <Card.Content extra>
                            <MenuPlay playlist={item} />
                        </Card.Content>
                        <Card.Content>
                            <Card.Meta>
                                <Icon name='music'/> {item.tracks.length} tracks
                            </Card.Meta>
                        </Card.Content>
                    </Card>
                </Grid.Column>
            );
        });

        return (
            <div>
                <h1>Playlists</h1>
                <Divider/>

                <Segment basic>
                    <AddPlaylist history={history} />
                </Segment>

                <Segment basic>
                    <Grid columns='3' doubling stackable>
                        {playLists}
                    </Grid>
                </Segment>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
      user: state.authenticationStore._user,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        createPlaylist: ( item ) => dispatch(
            post( 'playlist', {data: item} )
        ),
        getAllPlaylist: () => dispatch(
            get( `allPlaylist` )
        ),
    }
};

const AllPlaylistContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(AllPlaylist);


// HELPER
function updateAllPlaylist( arr, item ) {

    const array = arr.slice(0);

    for( let i = 0; i < array.length; i++ ) {

        if ( item.title === array[i].title ) {
            array[i] = item;
            return array;
        }
    }
    array.push(item);
    return array;
}

function updateDefaultPlaylist( arr, item ) {

    const array = arr.slice(0);

    for( let i = 0; i < array.length; i++ ) {

        if ( array[i].defaultPlaylist ) {
            array[i] = item;
            return array;
        }
    }
    array.unshift( item );
    return array;
}

function deleteDefaultPlaylist( arr ) {

    const array = arr.slice(0);

    for( let i = 0; i < array.length; i++ ) {

        if ( array[i].defaultPlaylist ) {
            array.splice(i, 1);
            return array;
        }
    }
    return array;
}

export default AllPlaylistContainer