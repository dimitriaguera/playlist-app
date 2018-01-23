import React, {Component} from 'react'
import {connect} from 'react-redux'
import {put, get} from 'core/client/services/core.api.services'
import {Form, Message, Button, Input, Icon, Header, Modal, Dropdown, Label} from 'semantic-ui-react'

import ps from 'core/client/services/core.path.services'

import socketServices from 'core/client/services/core.socket.services'


class EditMetaTag extends Component {

  constructor(props) {

    super(props);

    this.handleClose = this.props.onClose.bind(this);

    this.submitForm = this.submitForm.bind(this);

    // This 2 func handle when other user modify meta in same time
    this.updateNodeMetaOnSocketEvent = this.updateNodeMetaOnSocketEvent.bind(this);
    this.socket = socketServices.getPublicSocket();

    this.handleChange = this.handleChange.bind(this);
    this.handleChangeDropDown = this.handleChangeDropDown.bind(this);

    this.dropDownOpt = [
      {key: 'donothing', text: 'donothing', value: 'donothing'},
      {key: 'override', text: 'override', value: 'override'},
      {key: 'remove', text: 'remove', value: 'remove'},
      {key: 'add', text: 'add', value: 'add'},
    ];


    this.state = {
      error: false,
      loading: false,
      message: null,
      meta: this.initMeta(props.item.meta),
      metaAction: { // donothing, override, remove, add
        title: 'donothing',
        artist: 'donothing',
        album: 'donothing',
        albumartist: 'donothing',
        year: 'donothing',
        genre: 'donothing',
        composer: 'donothing',
        trackno: 'donothing',
        trackof: 'donothing',
        diskno: 'donothing',
        diskof: 'donothing',
      },
      inputDisable: {
        title: false,
        artist: false,
        album: false,
        albumartist: false,
        year: false,
        genre: false,
        composer: false,
        trackno: false,
        trackof: false,
        diskno: false,
        diskof: false
      },
      existingMetaBulk: {
        title: '',
        artist: '',
        album: '',
        albumartist: '',
        year: '',
        genre: '',
        composer: '',
        trackno: '',
        trackof: '',
        disk: ''
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
        trackno: meta.trackno || '',
        trackof: meta.trackof || '',
        diskno: meta.diskno || '',
        diskof: meta.diskof || ''
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
      trackno: '',
      trackof: '',
      diskno: '',
      diskof: ''
    }
  }


  /**
   * Giving a string return an array split by , ; /
   * If the input is not a string return it
   *
   * @param str
   * @returns {*}
   */
  checkStringReturnArray(str) {
    if (typeof str === 'string' || str instanceof String) {
      if (str.length) return str.split(/\s*[,;\/]\s*/);
      return [];
    }
    return str;
  }

  /**
   * Replace In arr empty string
   * @param arr
   * @param replacer
   * @param first if true replace first occurrence if false replace all occurrence
   */
  changeEmptyValInArray(arr, replacer, first) {
    if (!first) {
      for (let i = 0, li = arr.length; i < li; i++) {
        if (arr[i] === '') arr = replacer;
      }
    } else {
      let index = arr.indexOf('');
      if (index !== -1) arr[index] = replacer;
    }
    return arr;
  }

  /**
   * Remove duplicate value form an array
   * @param arr
   * @returns {[null]}
   */
  uniq(arr) {
    return [...new Set(arr)];
  }


  cleanMeta(meta) {

    let cleanMeta = Object.assign({}, meta);

    cleanMeta.genre = this.checkStringReturnArray(cleanMeta.genre);

    return cleanMeta;
  }


  componentWillMount() {

    const _self = this;

    // If other user modify meta on the same file print error.
    _self.socket.on('save:meta', _self.updateNodeMetaOnSocketEvent);

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
      _self.props.fetchFiles(ps.urlEncode(_self.props.item.path)).then((nodes) => {

        if (!nodes.success) return _self.setState(
          {
            error: true,
            loading: false,
            message: 'Issue when loading files !'
          }
        );

        let bulkMeta = {
          title: [],
          artist: [],
          album: [],
          albumartist: [],
          year: [],
          genre: [],
          composer: [],
          trackno: [],
          trackof: [],
          diskno: [],
          diskof: []
        };


        // Helper for loop on nodes
        let iNodes, liNodes = nodes.msg.length;

        // Helper for loop on bulkMeta Keys
        let jKeys, keys = Object.keys(bulkMeta), ljKeys = keys.length;

        // Fill bulkMeta with meta in all nodes and remove duplicate value
        // for instead of forEach for perf.
        for (jKeys = 0; jKeys < ljKeys; jKeys++) {
          for (iNodes = 0; iNodes < liNodes; iNodes++) {
            bulkMeta[keys[jKeys]] = bulkMeta[keys[jKeys]].concat(this.checkStringReturnArray(nodes.msg[iNodes].meta[keys[jKeys]]));
          }
          bulkMeta[keys[jKeys]] = this.changeEmptyValInArray(this.uniq(bulkMeta[keys[jKeys]]), 'NOT MET', true);
        }

        // Fill state.meta if is unique and
        // fill state.existingMetaBulk is not
        let newMeta = _self.initMeta();
        let newExistingMetaBulk = {};
        for (jKeys = 0; jKeys < ljKeys; jKeys++) {
          if (bulkMeta[keys[jKeys]].length === 1) {
            if (bulkMeta[keys[jKeys]][0] !== undefined && bulkMeta[keys[jKeys]][0] !== 'NOT MET') newMeta[keys[jKeys]] = bulkMeta[keys[jKeys]][0];
          } else {
            newExistingMetaBulk[keys[jKeys]] = bulkMeta[keys[jKeys]].join(', ');
          }
        }

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

  handleChange(e) {

    let name = e.target.name, value = e.target.value;

    let oldMeta = Object.assign({}, this.state.meta);

    oldMeta[name] = value;

    this.setState({
      meta: oldMeta
    })

  }

  handleChangeDropDown(e, {name, value}) {

    let oldMetaAction = Object.assign({}, this.state.metaAction);

    oldMetaAction[name] = value;

    this.setState({
      metaAction: oldMetaAction
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

    newNode.metaAction = _self.state.metaAction;

    // User authenticated on any role can create playlist.
    _self.props.updateNode(newNode)
      .then((data) => {
        if (!data.success) {
          _self.setState({loading: false, error: true, message: data.msg});
        }
        else {
          //_self.setState({loading: false, error: false, message: data.msg});
          this.handleClose();
        }
      });
  }

  render() {

    return (
      <Modal
        open={this.props.open}
        onClose={this.handleClose}
        onSubmit={(e) => this.submitForm(e)}
        basic size='small'
      >
        <Header content='Edit Metatag'/>

        <Modal.Content>

          <Form error success loading={this.state.loading}>

            {this.state.error ? (
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
                <input/>
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
                <input/>
                <Label>
                  <Dropdown name='artist' defaultValue='donothing' options={this.dropDownOpt}
                            onChange={(e, {name, value}) => this.handleChangeDropDown(e, {name, value})}/>
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
                <input/>
                <Label>
                  <Dropdown name='album' defaultValue='donothing' options={this.dropDownOpt}
                            onChange={(e, {name, value}) => this.handleChangeDropDown(e, {name, value})}/>
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
                <input/>
                <Label>
                  <Dropdown name='albumartist' defaultValue='donothing' options={this.dropDownOpt}
                            onChange={(e, {name, value}) => this.handleChangeDropDown(e, {name, value})}/>
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
                <input/>
                <Label>
                  <Dropdown name='year' defaultValue='donothing' options={this.dropDownOpt}
                            onChange={(e, {name, value}) => this.handleChangeDropDown(e, {name, value})}/>
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
                <input/>
                <Label>
                  <Dropdown name='genre' defaultValue='donothing' options={this.dropDownOpt}
                            onChange={(e, {name, value}) => this.handleChangeDropDown(e, {name, value})}/>
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
                <input/>
                <Label>
                  <Dropdown name='composer' defaultValue='donothing' options={this.dropDownOpt}
                            onChange={(e, {name, value}) => this.handleChangeDropDown(e, {name, value})}/>
                </Label>
              </Input>
              <div>{this.state.existingMetaBulk.composer}</div>
            </Form.Field>

            <Form.Field inline>
              <Input
                labelPosition='left'
                type='number'
                name='trackno'
                value={this.state.meta.trackno}
                onChange={this.handleChange}
                disabled={this.state.inputDisable.trackno}>
                <Label>Track n°</Label>
                <input/>
                <Label>
                  <Dropdown name='trackno' defaultValue='donothing' options={this.dropDownOpt}
                            onChange={(e, {name, value}) => this.handleChangeDropDown(e, {name, value})}/>
                </Label>
              </Input>
              <div>{this.state.existingMetaBulk.trackno}</div>


              <Input
                labelPosition='left'
                type='number'
                name='trackof'
                value={this.state.meta.trackof}
                onChange={this.handleChange}
                disabled={this.state.inputDisable.trackof}>
                <Label>Track of</Label>
                <input/>
                <Label>
                  <Dropdown name='trackof' defaultValue='donothing' options={this.dropDownOpt}
                            onChange={(e, {name, value}) => this.handleChangeDropDown(e, {name, value})}/>
                </Label>
              </Input>
              <div>{this.state.existingMetaBulk.trackof}</div>

            </Form.Field>

            <Form.Field inline>

              <Input
                labelPosition='left'
                type='number'
                name='diskno'
                value={this.state.meta.diskno}
                onChange={this.handleChange}
                disabled={this.state.inputDisable.diskno}>
                <Label>Disc n°</Label>
                <input/>
                <Label>
                  <Dropdown name='diskno' defaultValue='donothing' options={this.dropDownOpt}
                            onChange={(e, {name, value}) => this.handleChangeDropDown(e, {name, value})}/>
                </Label>
              </Input>
              <div>{this.state.existingMetaBulk.diskno}</div>

              <Input
                labelPosition='left'
                type='number'
                name='diskof'
                value={this.state.meta.diskof}
                onChange={this.handleChange}
                disabled={this.state.inputDisable.diskof}>
                <Label>Disc of</Label>
                <input/>
                <Label>
                  <Dropdown name='diskof' defaultValue='donothing' options={this.dropDownOpt}
                            onChange={(e, {name, value}) => this.handleChangeDropDown(e, {name, value})}/>
                </Label>
                <div>{this.state.existingMetaBulk.diskof}</div>
              </Input>
            </Form.Field>

            <div>
              <Button type='button' onClick={this.handleClose} basic color='red' inverted>
                <Icon name='remove'/> No
              </Button>
              <Button type='submit' color='green' inverted>
                <Icon name='checkmark'/> Yes
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
    updateNode: (item) => dispatch(
      put('nodes/' + item._id + '/meta', {data: item})
    ),

    fetchFiles: (query) => dispatch(
      get(`nodes/q/files?path=${query || ''}`)
    )

  }
};

const EditMetaTagContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(EditMetaTag);

export default EditMetaTagContainer