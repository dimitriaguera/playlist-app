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
            nbCards: 3,
            allPlaylist: [],
        }
    }

    componentWillMount() {
        const _self = this;
        this.props.getAllPlaylist()
            .then( (data) => {
                if( data.success ){
                    _self.setState({ allPlaylist: data.msg });
                }
            });

        this.socket.on('save:playlist', (data) => {
            const apl = _self.state.allPlaylist.slice(0);
            apl.push(data);
            _self.setState({ allPlaylist: apl })
        });
    }

    // On unmount component, disconnect Socket.io.
    componentWillUnmount() {
        this.socket.disconnect();
        console.log("Disconnecting Socket as component will unmount");
    }

    render(){

        const { allPlaylist, nbCards } = this.state;
        const { history } = this.props;

        const playLists = allPlaylist.map( (item, i) => {
            return (
                <Grid.Column key={i}>
                    <Card>
                        {/*<Image src='/static/images/test.jpg' />*/}
                        <Card.Content>
                            <Card.Header as={Link} to={`/playlist/${item.title}`}>
                                {item.title}
                            </Card.Header>
                            <Card.Meta>Created by {item.author.username}</Card.Meta>
                            <Link as='a' to={`/music?pl=${item.title}`}>+ add tracks</Link>
                        </Card.Content>
                        <Card.Content extra><MenuPlay isMini playlist={item} /></Card.Content>
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
                <h1>All Playlists</h1>
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

const mapDispatchToProps = dispatch => {
    return {
        createPlaylist: ( item ) => dispatch(
            post( 'playlist', {data: item} )
        ),
        getAllPlaylist: ( item ) => dispatch(
            get( 'allPlaylist' )
        ),
    }
};

const AllPlaylistContainer = connect(
    null,
    mapDispatchToProps
)(AllPlaylist);

export default AllPlaylistContainer