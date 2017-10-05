import React, { Component } from 'react'
import { connect } from 'react-redux'
import { del } from 'core/client/services/core.api.services'
import { Menu, Icon } from 'semantic-ui-react'

class MenuEditPlaylist extends Component {

    constructor() {
        super();
        this.deleteHandler = this.deleteHandler.bind(this);
        this.state = {
            error: false,
            message: '',
        }
    }

    deleteHandler(e) {

        const _self = this;
        const {  target, onDelete, history } = _self.props;

        onDelete(target.title)
            .then( (data) => {
                if ( !data.success ) {
                    return _self.setState({error: true, message: 'Suppression failed'});
                }
                return history.push('/allPlaylist');
            });
    }

    render(){

        const { history, target } = this.props;

        return (
            <Menu>
                <Menu.Item onClick={(e) => history.push(`/folder?pl=${target.title}`)}>
                    <Icon name='plus' color='teal'/>Add Tracks
                </Menu.Item>
                <Menu.Menu position='right'>
                    <Menu.Item onClick={this.deleteHandler}>
                        Delete playlist
                    </Menu.Item>
                </Menu.Menu>
            </Menu>
        );
    }
}

const mapDispatchToProps = dispatch => {
    return {
        onDelete: ( title ) => dispatch(
            del( `playlist/${title}` )
        ),
    }
};

const MenuEditPlaylistContainer = connect(
    null,
    mapDispatchToProps
)(MenuEditPlaylist);


export default MenuEditPlaylistContainer