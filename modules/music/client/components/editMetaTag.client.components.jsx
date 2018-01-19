import React, { Component } from 'react'
import { connect } from 'react-redux'
import { put, get } from 'core/client/services/core.api.services'
import { Form, Message, Button, Input, Icon, Header, Modal, Dropdown, Label} from 'semantic-ui-react'

import ps from 'core/client/services/core.path.services'

import socketServices from 'core/client/services/core.socket.services'


class EditMetaTag extends Component {

  constructor( props ) {

    super( props );

    this.handleClose = this.props.onClose.bind(this);

    this.submitForm = this.submitForm.bind(this);

    // This 2 func handle when other user modify meta in same time
    this.updateNodeMetaOnSocketEvent = this.updateNodeMetaOnSocketEvent.bind(this);
    this.socket = socketServices.getPublicSocket();

    this.handleChange = this.handleChange.bind(this);
    this.handleChangeDropDown = this.handleChangeDropDown.bind(this);

    this.dropDownOpt = [
      { key: 'donothing', text: 'donothing', value: 'donothing'},
      { key: 'override', text: 'override', value: 'override' },
      { key: 'addvalue', text: 'addvalue', value: 'addvalue' },
    ];


    this.state = {
      error: false,
      loading: false,
      message: null,
      meta: this.initMeta(props.item.meta),
      metaFlag: { // donothing, replace, add
        title: 'donothing',
        artist: 'donothing',
        album: 'donothing',
        albumartist: 'donothing',
        year: 'donothing',
        genre: 'donothing',
        composer: 'donothing',
        track: 'donothing',
        disk: 'donothing'
      },
      inputDisable: {
        title: false,
        artist: false,
        album: false,
        albumartist: false,
        year: false,
        genre: false,
        composer: false,
        track: false,
        disk: false
      },
      existingMetaBulk: {
        title: null,
        artist: null,
        album: null,
        albumartist: null,
        year: null,
        genre: null,
        composer: null,
        track: null,
        disk: null
      }
    };
  }


  initMeta(meta) {
    if (meta) {
      return {
        title: meta.title || '',
        artist: meta.artist || '',
        album: meta.album || '',
        albumartist: meta.albumartist || '',
        year: meta.year || '',
        genre: (meta.genre) ? meta.genre.join(', ') : '',
        composer: meta.composer || '',
        track: meta.track || {no: '', of: ''},
        disk: meta.disk || {no: '', of: ''}
      }
    }

    return {
        title: '',
        artist: '',
        album: '',
        albumartist: '',
        year: '',
        genre: '',
        composer: '',
        track: {no: '', of: ''},
        disk: {no: '', of: ''}
    }
  }


  componentWillMount() {

    const _self = this;
    
    // If other user modify meta on the same file print error.
    _self.socket.on('save:meta', _self.updateNodeMetaOnSocketEvent );

    // Check if isFile and fill meta
    if (_self.props.item.isFile) {
      if (!_self.props.item.meta) {
        _self.setState(
          {
            error: true,
            loading: false,
            message: 'No meta found !',
          });
      }
      
    // If is Album dir get all files
    } else {

      // Get all files in the dir
      _self.props.fetchFiles( ps.urlEncode(_self.props.item.path) ).then((data) => {

        if ( !data.success ) return _self.setState(
          { 
            error: true,
            loading: false,
            message: 'Issue when loading files !'
          }
        );

        let bulkMeta = {
          title:  [],
          artist:  [],
          album:  [],
          albumartist:  [],
          year:  [],
          genre:  [],
          composer:  [],
          diskno: [],
          diskof: []
        };

        //@todo put this in a service file obj.serve.services.js
        function pushUniq(newData , Array){

          if (Array.findIndex(elmt => elmt === newData) === -1){
            if (newData !== undefined) Array.push(newData);
          }

        }


        function checkStringReturnArray(str){
          if (typeof str === 'string' || str instanceof String) {
            return str.split(/\s*[,;\/]\s*/);
          }
          return str;
        }

        function uniq(arr){
          return [...new Set(arr)];
        }

        function mergeUniqArray(arr1, arr2) {
          return uniq(arr1.concat(arr2));
        }

        // Fill bulkMeta with unique value
        for (let i = 0, l = data.msg.length ; i < l ; i ++){

          Object.keys(bulkMeta).forEach( (key) => {
            if (key === 'genre') {
              for( let j = 0, lj = data.msg[i].meta[key].length ; j < lj ; j++){
                pushUniq(data.msg[i].meta[key][j] , bulkMeta[key]);
              }
            } else if (key === 'diskno') {
              pushUniq(data.msg[i].meta.disk.no , bulkMeta[key]);
              pushUniq(data.msg[i].meta.disk.of , bulkMeta[key]);
            } else if (key === 'trackof') {
              pushUniq(data.msg[i].meta.track.no , bulkMeta[key]);
              pushUniq(data.msg[i].meta.track.of , bulkMeta[key]);
            } else if (key === 'title') {
              // Do nothing
            } else if (data.msg[i].meta[key] === null) {
              pushUniq('NOT MET' , bulkMeta[key]);
            } else {
              pushUniq(data.msg[i].meta[key] , bulkMeta[key]);
            }
          });

        }

        // let i, li = data.msg.length;
        // let j, keys = Object.keys(bulkMeta), lj = keys.length;
        //
        // for (j = 0 ; j < lj ; j++ ){
        //   for (i = 0 ; i< li; i++ ) {
        //
        //     if (keys[j] === 'diskno') {
        //       pushUniq(data.msg[i].meta.disk.no , bulkMeta[keys[j]]);
        //       pushUniq(data.msg[i].meta.disk.of , bulkMeta[keys[j]]);
        //     } else if (keys[j] === 'trackof') {
        //       pushUniq(data.msg[i].meta.track.no, bulkMeta[keys[j]]);
        //       pushUniq(data.msg[i].meta.track.of, bulkMeta[keys[j]]);
        //     }
        //     bulkMeta[keys[j]] = bulkMeta[keys[j]].concat(checkStringReturnArray(data.msg[i].meta[keys[j]]));
        //
        //
        //
        //   }
        //   bulkMeta[keys[j]] = uniq(bulkMeta[keys[j]]);
        // }


        // Fill state.meta if is unique and
        // fill state.existingMetaBulk is not
        // let newMeta = Object.assign(){
        //   track: {no: '', of: ''},
        //   disk: {no: '', of: ''}
        // };
        let newMeta = _self.initMeta();
        let newExistingMetaBulk = {};
        Object.keys(bulkMeta).forEach( (key) => {
          if (key === 'diskno') {
            if (bulkMeta[key].length === 1) {
              if (bulkMeta[key][0] !== undefined && bulkMeta[key][0] !== 'NOT MET') newMeta.disk.no = bulkMeta[key][0];
            } else {
              newExistingMetaBulk[key] = bulkMeta[key].join(', ');
            }
          } else if (key === 'diskof') {
            if (bulkMeta[key].length === 1) {
              if (bulkMeta[key][0] !== undefined && bulkMeta[key][0] !== 'NOT MET') newMeta.disk.of = bulkMeta[key][0];
            } else {
              newExistingMetaBulk[key] = bulkMeta[key].join(', ');
            }
          } else {
            if (bulkMeta[key].length === 1) {
              if (bulkMeta[key][0] !== undefined && bulkMeta[key][0] !== 'NOT MET') newMeta[key] = bulkMeta[key][0];
            } else {
              newExistingMetaBulk[key] = bulkMeta[key].join(', ');
            }
          }
        });



        // Update state
        _self.setState({
          loading: false,
          error: false,
          meta: newMeta,
          inputDisable: {
            title: true,
            artist: false,
            album: false,
            albumartist: false,
            year: false,
            genre: false,
            composer: false,
            track: true,
            disk: false
          },
          existingMetaBulk: newExistingMetaBulk
        });

      });
    }

  }

  componentWillUnmount() {
    this.socket.removeListener('save:meta', this.updateNodeMetaOnSocketEvent);
  }

  // If other user modify meta on the same file print error.
  updateNodeMetaOnSocketEvent(data) {

    let oldNode = Object.assign([], this.props.item);

    // Find if it is the same file
    for (let i = 0, l = data.length; i < l; i++) {
      if (oldNode._id === data[i]._id) {
        this.setState({
          error: true,
          loading: false,
          message: 'Meta is actualy change by an other user. Please refresh the page',
        });
        break;
      }
    }
  }

  handleChange(e){

    let name = e.target.name, value = e.target.value;

    let oldMeta = Object.assign({}, this.state.meta);

    if (name === 'diskno'){
      oldMeta.disk.no = value;
    } else if (name === 'diskof'){
      oldMeta.disk.of = value
    } else if (name === 'trackno'){
      oldMeta.track.no = value
    } else if (name === 'trackof'){
      oldMeta.track.of = value
    } else {
      oldMeta[name] = value;
    }

    this.setState({
     meta: oldMeta
    })

  }

  handleChangeDropDown(e, {name, value}){

    let oldMetaFlag = Object.assign({}, this.state.metaFlag);

    oldMetaFlag[name] = value;

    this.setState({
      metaFlag: oldMetaFlag
    })

  }



  submitForm(e) {

    const _self = this;


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

    let newNode = Object.assign({}, _self.props.item);
    newNode.meta = _self.cleanMeta(_self.state.meta);

    newNode.metaFlag = _self.state.metaFlag;

    // User authenticated on any role can create playlist.
    _self.props.updateNode(newNode)
      .then( (data) => {
        if (!data.success) {
          _self.setState({loading: false, error: true, message: data.msg});
        }
        else {
          //_self.setState({loading: false, error: false, message: data.msg});
          this.handleClose();
        }
    });
  }


  cleanMeta(meta) {

      let cleanMeta = Object.assign({}, meta);

      // Set to null empty value
      Object.keys(cleanMeta).forEach( (key) => {
        if (cleanMeta[key] === '') cleanMeta[key] = null;
      });

      // Transform track in obj
      if (cleanMeta.trackno) {
        cleanMeta.track = {
          no: cleanMeta.trackno || '0',
          of: cleanMeta.trackof || '0',
        };
      }
      delete cleanMeta.trackno;
      delete cleanMeta.trackof;

      // Transform disk in obj
      if (cleanMeta.diskno) {
        cleanMeta.disk = {
          no: cleanMeta.diskno || '0',
          of: cleanMeta.diskof || '0',
        };
      }
      delete cleanMeta.diskno;
      delete cleanMeta.diskof;

      // Convert Genre in tab and split it
      if (typeof cleanMeta.genre === 'string' || cleanMeta.genre instanceof String) {
        cleanMeta.genre = cleanMeta.genre.split(/\s*[,;\/]\s*/);
      }

      // cleanMeta.albumartist composer doesn't exist if null empty
      if (cleanMeta.albumartist === null) delete cleanMeta.albumartist;
      if (cleanMeta.composer === null) delete cleanMeta.composer;

      return cleanMeta;
  }

  render(){

    return (
      <Modal
        open={this.props.open}
        onClose={this.handleClose}
        onSubmit={(e) => this.submitForm(e)}
        basic size='small'
      >
        <Header content='Edit Metatag' />

        <Modal.Content>

          <Form error success loading={this.state.loading} >

            { this.state.error ? (
                <Message error content={this.state.message}/>
                )
                :
                (
                <Message success content={this.state.message}/>
                )
            }

            <Form.Field inline>

              <Input
                labelPosition='left'
                placeholder='Title'
                name='title'
                value={this.state.meta.title}
                onChange={this.handleChange}
                disabled={this.state.inputDisable.title}>
                <Label>Title</Label>
                <input />
                <Label>
                  <Dropdown name='titleDropDown' defaultValue='donothing' options={this.dropDownOpt}/>
                </Label>
              </Input>

              <div>{this.state.existingMetaBulk.title}</div>
            </Form.Field>

            <Form.Field inline>
              <Input
                labelPosition='left'
                placeholder='Artist'
                name='artist'
                value={this.state.meta.artist}
                onChange={this.handleChange}
                disabled={this.state.inputDisable.artist}>
                <Label>Artist</Label>
                <input />
                <Label>
                  <Dropdown name='artist' defaultValue='donothing' options={this.dropDownOpt} onChange={ (e, {name, value}) => this.handleChangeDropDown(e, {name, value})} />
                </Label>
              </Input>
              <div>{this.state.existingMetaBulk.artist}</div>
            </Form.Field>

            <Form.Field inline>
              <Input
                labelPosition='left'
                placeholder='Album'
                name='album'
                value={this.state.meta.album}
                onChange={this.handleChange}
                disabled={this.state.inputDisable.album}>
                <Label>Album</Label>
                <input />
                <Label>
                  <Dropdown name='album' defaultValue='donothing' options={this.dropDownOpt} onChange={ (e, {name, value}) => this.handleChangeDropDown(e, {name, value})} />
                </Label>
              </Input>
              <div>{this.state.existingMetaBulk.album}</div>
            </Form.Field>

            <Form.Field inline>
              <Input
                labelPosition='left'
                placeholder='Album Artist'
                name='albumartist'
                value={this.state.meta.albumartist}
                onChange={this.handleChange}
                disabled={this.state.inputDisable.albumartist}>
                <Label>Album Artist</Label>
                <input />
                <Label>
                  <Dropdown name='albumartist' defaultValue='donothing' options={this.dropDownOpt} onChange={ (e, {name, value}) => this.handleChangeDropDown(e, {name, value})} />
                </Label>
              </Input>
              <div>{this.state.existingMetaBulk.albumartist}</div>
            </Form.Field>

            <Form.Field inline>
              <Input
                labelPosition='left'
                type='number'
                placeholder='Year'
                name='year'
                value={this.state.meta.year}
                onChange={this.handleChange}
                disabled={this.state.inputDisable.year}>
                <Label>Year</Label>
                <input />
                <Label>
                  <Dropdown name='year' defaultValue='donothing' options={this.dropDownOpt} onChange={ (e, {name, value}) => this.handleChangeDropDown(e, {name, value})} />
                </Label>
              </Input>
              <div>{this.state.existingMetaBulk.year}</div>
            </Form.Field>

            <Form.Field inline>
              <Input
                labelPosition='left'
                placeholder='Genre'
                name='genre'
                value={this.state.meta.genre}
                onChange={this.handleChange}
                disabled={this.state.inputDisable.genre}>
                <Label>Genre</Label>
                <input />
                <Label>
                  <Dropdown name='genre' defaultValue='donothing' options={this.dropDownOpt} onChange={ (e, {name, value}) => this.handleChangeDropDown(e, {name, value})} />
                </Label>
              </Input>
              <div>{this.state.existingMetaBulk.genre}</div>
            </Form.Field>

            <Form.Field inline>
              <Input
                labelPosition='left'
                placeholder='Composer' name='composer'
                value={this.state.meta.composer}
                onChange={this.handleChange}
                disabled={this.state.inputDisable.composer}>
                <Label>Composer</Label>
                <input />
                <Label>
                  <Dropdown name='composer' defaultValue='donothing' options={this.dropDownOpt} onChange={ (e, {name, value}) => this.handleChangeDropDown(e, {name, value})} />
                </Label>
              </Input>
              <div>{this.state.existingMetaBulk.composer}</div>
            </Form.Field>

            <Form.Field inline>
              <Input label='Track n°' type='number' name='trackno'
                     value={this.state.meta.track.no}
                     onChange={this.handleChange}
                     disabled={this.state.inputDisable.track}/>
              <Input label='of' type='number' name='trackof'
                     value={this.state.meta.track.of}
                     onChange={this.handleChange}
                     disabled={this.state.inputDisable.track}/>
            </Form.Field>

            <Form.Field inline>
              <Input label='Disc n°' type='number' name='diskno'
                     value={this.state.meta.disk.no}
                     onChange={this.handleChange}
                     disabled={this.state.inputDisable.disk}/>
              <div>{this.state.existingMetaBulk.diskno}</div>
              <Input label='of' type='number' name='diskof'
                     value={this.state.meta.disk.of}
                     onChange={this.handleChange}
                     disabled={this.state.inputDisable.disk}/>
              <div>{this.state.existingMetaBulk.diskof}</div>
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
    ),

    fetchFiles: ( query ) => dispatch(
      get( `nodes/q/files?path=${query || ''}` )
    )

  }
};

const EditMetaTagContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(EditMetaTag);

export default EditMetaTagContainer