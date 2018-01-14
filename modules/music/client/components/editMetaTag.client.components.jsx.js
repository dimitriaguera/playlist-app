import React, { Component } from 'react'
import { connect } from 'react-redux'
import { put } from 'core/client/services/core.api.services'
import { Form, Message, Button, Input, Icon, Header, Modal} from 'semantic-ui-react'

class EditMetaTag extends Component {

  constructor( props ) {
    super( props );

    this.submitForm = this.submitForm.bind(this);

    this.handleClose = this.handleClose.bind(this);
    this.handleOpen = this.handleOpen.bind(this);

    this.state = {
      error: false,
      loading: false,
      message: null,
      modalOpen: false
    }
  }

  componentWillMount() {
    if (this.props.item.meta){
      this.meta = {
        title: this.props.item.meta.title || '',
        artist: this.props.item.meta.artist || '',
        album: this.props.item.meta.album || '',
        albumartist: this.props.item.meta.albumartist || '',
        year: this.props.item.meta.year || '',
        genre: this.props.item.meta.genre || '',
        composer: this.props.item.meta.composer || '',
        track: this.props.item.meta.track || '',
        disk: this.props.item.meta.disk || ''
      };
    } else {
      this.meta = {
        title: '',
        artist: '',
        album: '',
        albumartist: '',
        year: '',
        genre: '',
        composer: '',
        track: '',
        disk: ''
      };
    }
  }

  handleOpen() {
    this.setState({modalOpen: true});
  }

  handleClose() {
    this.setState({
      modalOpen: false,
      error: false,
      loading: false,
      message: null,
    });
  }

  submitForm(e) {

    const _self = this;
    const { user, history, updateNode, redirect } = _self.props;

    _self.setState({loading: true});

    // User need to be authenticated.
    // @todo uncomment this
    // if ( !user ) {
    //   if ( !history ) {
    //     return _self.setState({
    //       error: true,
    //       message: 'You must login to change MetaTag.',
    //     });
    //   }
    //   else {
    //     return history.push('/login');
    //   }
    // }

    // I use this method because if a use the 'normal' way
    // with state, default value, and onChange function
    // The program is slow when user press long time on del
    function getMetaFromForm(e) {

      let obj= {}, i = 0;

      while (e.target[i].name) {
        obj[e.target[i].name] = (e.target[i].value === '') ? null : e.target[i].value;
        i++;
      }

      // Transform disk and track in obj
      obj.track = {
        no: obj.trackno || '0',
        of: obj.trackof || '0',
      };
      delete obj.trackno;
      delete obj.trackof;

      obj.disk = {
        no: obj.diskno || '0',
        of: obj.diskof || '0',
      };
      delete obj.diskno;
      delete obj.diskof;

      // Convert Genre in tab and split it
      obj.genre = (obj.genre) ? obj.genre.split(/\s*[,;\/]\s*/) : [];

      // cleanMeta.albumartist composer doesn't exist if null empty
      if (obj.albumartist === null) delete obj.albumartist;
      if (obj.composer === null) delete obj.composer;

      return obj;
    }

    let newNode = {};
    newNode = Object.assign(newNode, _self.props.item);
    newNode.meta = getMetaFromForm(e);

    // User authenticated on any role can create playlist.
    updateNode(newNode)
      .then( (data) => {

        _self.setState({loading: false});

        if (!data.success) {
          _self.setState({error: true, message: data.msg});
        } else {
          _self.setState({error: false, message: data.msg});
          if ( redirect ) {
            return history.push(`/playlist/${title}`);
          }
        }
      });
  }


  render(){

    return (
      <Modal
        trigger={<Button onClick={this.handleOpen} icon basic color="teal"><Icon name='tags' /></Button>}
        open={this.state.modalOpen}
        onClose={this.handleClose}
        onSubmit={(e) => this.submitForm(e)}
        basic size='small'
      >
        <Header content='Edit Metatag' />
        <Modal.Content>

          <Form error success loading={this.state.loading} >

            {this.state.error ? (
              <Message error content={this.state.message}/>
              )
              :
              (
              <Message success content={this.state.message}/>
              )
            }


            <Form.Field inline>
              <Input label='Title' placeholder='Title' name='title' defaultValue={this.meta.title} />
            </Form.Field>

            <Form.Field inline>
              <Input label='Artist' placeholder='Artist' name='artist' defaultValue={this.meta.artist} />
            </Form.Field>
            <Form.Field inline>
              <Input label='Album' placeholder='Album' name='album' defaultValue={this.meta.album} />
            </Form.Field>
            <Form.Field inline>

              <Input label='Album Artist' placeholder='Album Artist' name='albumartist' defaultValue={this.meta.albumartist} />
            </Form.Field>
            <Form.Field inline>
              <Input label='Year' type='number' placeholder='Year' name='year' defaultValue={this.meta.year} />
            </Form.Field>
            <Form.Field inline>
              <Input label='Genre' placeholder='Genre' name='genre' defaultValue={this.meta.genre} />
            </Form.Field>
            <Form.Field inline>
              <Input label='Composer' placeholder='Composer' name='composer' defaultValue={this.meta.composer} />
            </Form.Field>


            <Form.Field inline>
              <Input label='Track n°' type='number' name='trackno' defaultValue={this.meta.track.no} />
              <Input label='of' type='number' name='trackof' defaultValue={this.meta.track.of} />
            </Form.Field>

            <Form.Field inline>
              <Input label='Disc n°' type='number' name='diskno' defaultValue={this.meta.disk.no} />
              <Input label='of' type='number' name='diskof' defaultValue={this.meta.disk.of} />
            </Form.Field>

            <div>
              <Button type='button' onClick={this.handleClose} basic color='red' inverted>
                <Icon name='remove' /> No
              </Button>
              <Button type='submit' color='green' inverted>
                <Icon name='checkmark' /> Yes
              </Button>
            </div>

          </Form>

        </Modal.Content>
      </Modal>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.authenticationStore._user
  }
};

const mapDispatchToProps = dispatch => {
  return {
    updateNode: ( item ) => dispatch (
      put( 'nodes/' + item._id + '/meta', {data: item} )
    )
  }
};

const EditMetaTagContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(EditMetaTag);

export default EditMetaTagContainer