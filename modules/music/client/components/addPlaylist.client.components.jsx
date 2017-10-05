import React, { Component } from 'react'
import { connect } from 'react-redux'
import { post } from 'core/client/services/core.api.services'
import { Form, Message } from 'semantic-ui-react'

class AddPlaylist extends Component {

    constructor( props ) {
        super( props );
        this.handleInputChange = this.handleInputChange.bind(this);
        this.submitForm = this.submitForm.bind(this);
        this.state = {
            error: false,
            message: '',
            title:'',
        }
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

    render(){

        const { error, message, title } = this.state;


        return (
            <Form error={error} onSubmit={this.submitForm}>
                <Message error content={message}/>
                <Form.Input
                    action={{ color: 'teal', labelPosition: 'left', icon: 'list layout', content: 'Create' }}
                    actionPosition='left'
                    placeholder='Playlist Title...'
                    name='title'
                    value={title}
                    onChange={this.handleInputChange}
                />
            </Form>
        );
    }
}

const mapDispatchToProps = dispatch => {
    return {
        createPlaylist: ( item ) => dispatch(
            post( 'playlist', {data: item} )
        ),
    }
};

const AddPlaylistContainer = connect(
    null,
    mapDispatchToProps
)(AddPlaylist);

export default AddPlaylistContainer