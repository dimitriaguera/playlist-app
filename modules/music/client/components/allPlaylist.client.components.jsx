import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { get, post } from 'core/client/services/core.api.services'
import socketServices from 'core/client/services/core.socket.services'
import MenuPlay from './menuPlay.client.components'
import { Divider, Form, Message, Card, Segment, Responsive, Image } from 'semantic-ui-react'

class AllPlaylist extends Component {

    constructor( props ) {
        super( props );
        this.socket = socketServices.getPublicSocket();
        this.handleInputChange = this.handleInputChange.bind(this);
        this.submitForm = this.submitForm.bind(this);
        this.state = {
            nbCards: 3,
            allPlaylist: [],
            error: false,
            message: '',
            title:'',
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

    handleInputChange(e) {

        const target = e.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    submitForm(e) {
        const _self = this;
        const { title } = this.state;
        this.props.createPlaylist({ title: title })
            .then( (data) => {
                if (!data.success) {
                    _self.setState({message: data.msg, error: true });
                } else {
                    _self.setState({error: false, title: ''});
                }
            });
    }

    handleOnResponsiveUpdate() {

    }

    render(){

        const { allPlaylist, error, message, title, nbCards } = this.state;

        const playLists = allPlaylist.map( (item, i) => {
            return (
                <Card key={i}>
                    <Image src='/static/images/test.jpg' />
                    <Card.Content>
                        <Card.Header as={Link} to={`/playlist/${item.title}`}>
                            {item.title}
                        </Card.Header>
                        <Card.Meta>{item.tracks.length} Tracks</Card.Meta>
                    </Card.Content>
                    <Card.Content extra><MenuPlay isMini playlist={item} /></Card.Content>
                </Card>
            );
        });

        return (
            <div>
                <h1>All Playlists</h1>
                <Divider/>

                <Segment basic>
                    <Form error={error} onSubmit={this.submitForm}>
                        <Message error content={message}/>
                        <Form.Input
                            action={{ color: 'teal', labelPosition: 'left', icon: 'list layout', content: 'Add' }}
                            actionPosition='left'
                            placeholder='Playlist Title...'
                            name='title'
                            value={title}
                            onChange={this.handleInputChange}
                        />
                    </Form>
                </Segment>

                <Segment basic>
                    <Responsive as={Card.Group} onUpdate={this.handleOnResponsiveUpdate} itemsPerRow={nbCards}>
                        {playLists}
                    </Responsive>
                </Segment>
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