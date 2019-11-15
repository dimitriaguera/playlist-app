import React, { Component } from 'react';
import { connect } from 'react-redux';
import { put, get } from 'core/client/services/core.api.services';
import { Form, Message, Input, Dropdown, Label } from 'semantic-ui-react';
import Select from 'react-select';
import Modal from 'react-modal';
import ps from 'core/client/services/core.path.services';

import socketServices from 'core/client/services/core.socket.services';

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
    this.handleChangeCheckBox = this.handleChangeCheckBox.bind(this);

    this.selectOpt = [
      { key: 'donothing', label: 'donothing', value: 'donothing' },
      { key: 'override', label: 'override', value: 'override' },
      { key: 'remove', label: 'remove', value: 'remove' },
      { key: 'add', label: 'add', value: 'add' }
    ];

    this.state = {
      error: false,
      loading: false,
      message: null,
      meta: initMeta(props.item.meta),
      metaAction: initMetaAction(), // donothing, override, remove, add
      saveCheckBox: {
        updateDBES: true,
        updateFiles: false
      },
      inputDisable: initInput(),
      existingMetaBulk: initMeta() // meta in array
    };
  }

  componentWillMount() {
    const _self = this;

    // React Modal
    Modal.setAppElement('#root');

    // If other user modify meta on the same file print error.
    _self.socket.on('save:meta', _self.updateNodeMetaOnSocketEvent);

    // Check if isFile and fill meta
    if (_self.props.item.isFile) {
      if (!_self.props.item.meta) {
        _self.setState({
          error: true,
          loading: false,
          message: 'No meta found !'
        });
      }

      // If is Album dir get all files
    } else {
      // Get all files in the dir
      _self.props.fetchFiles(ps.urlEncode(_self.props.item.path)).then(nodes => {
        if (!nodes.success) {
          return _self.setState({
            error: true,
            loading: false,
            message: 'Issue when loading files !'
          });
        }

        let bulkMeta = initBulkMeta();

        // Helper for loop on nodes
        let iNodes,
          liNodes = nodes.msg.length;

        // Helper for loop on bulkMeta Keys
        let jKeys,
          keys = Object.keys(bulkMeta),
          ljKeys = keys.length;

        // Fill bulkMeta with meta in all nodes and remove duplicate value
        // for instead of forEach for perf.
        for (jKeys = 0; jKeys < ljKeys; jKeys++) {
          for (iNodes = 0; iNodes < liNodes; iNodes++) {
            bulkMeta[keys[jKeys]] = bulkMeta[keys[jKeys]].concat(
              checkStringReturnArray(nodes.msg[iNodes].meta[keys[jKeys]])
            );
          }
          bulkMeta[keys[jKeys]] = changeEmptyValInArray(
            uniq(bulkMeta[keys[jKeys]]),
            'NOT MET',
            true
          );
        }

        // Fill state.meta if is unique and
        // fill state.existingMetaBulk is not
        let newMeta = initMeta();
        let newExistingMetaBulk = {};
        for (jKeys = 0; jKeys < ljKeys; jKeys++) {
          if (bulkMeta[keys[jKeys]].length === 1) {
            if (
              bulkMeta[keys[jKeys]][0] !== undefined &&
              bulkMeta[keys[jKeys]][0] !== 'NOT MET'
            )
              newMeta[keys[jKeys]] = bulkMeta[keys[jKeys]][0];
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
          message: 'Meta is actualy change by an other user. Please refresh the page'
        });
        break;
      }
    }
  }

  handleChange(e) {
    let name = e.target.name,
      value = e.target.value;

    let oldMeta = Object.assign({}, this.state.meta);

    oldMeta[name] = value;

    this.setState({
      meta: oldMeta
    });
  }

  handleChangeDropDown(selected, name) {
    let oldMetaAction = Object.assign({}, this.state.metaAction);

    oldMetaAction[name] = selected.value;

    this.setState({
      metaAction: oldMetaAction
    });
  }

  handleChangeCheckBox(e) {
    let oldSaveCheckBox = Object.assign({}, this.state.saveCheckBox);

    oldSaveCheckBox[e.target.name] = e.target.checked;

    this.setState({
      saveCheckBox: oldSaveCheckBox
    });
  }

  submitForm() {
    const _self = this;

    _self.setState({ loading: true });

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
    newNode.meta = cleanMeta(_self.state.meta);

    newNode.metaAction = _self.state.metaAction;

    newNode.opts = _self.state.saveCheckBox;

    // User authenticated on any role can create playlist.
    _self.props.updateNode(newNode).then(data => {
      if (!data.success) {
        _self.setState({ loading: false, error: true, message: data.msg });
      } else {
        // _self.setState({loading: false, error: false, message: data.msg});
        this.handleClose();
      }
    });
  }

  buildFieldForm(name, label, placeholder, inputType) {
    inputType = inputType ? inputType : 'text';

    return (
      <div className="form-row">
        <label className="meta-label h3-like" htmlFor={name}>
          {label}
        </label>

        <div className="meta-action">
          <input
            id={name}
            type={inputType}
            className="meta-input"
            placeholder={placeholder}
            name={name}
            value={this.state.meta[name]}
            onChange={this.handleChange}
            disabled={this.state.inputDisable[name]}
          ></input>

          <Select
            name={name}
            className="meta-select"
            clearable={false}
            onChange={selectedOpt => this.handleChangeDropDown(selectedOpt, name)}
            value={this.state.metaAction[name]}
            options={this.selectOpt}
          />
        </div>

        {this.state.existingMetaBulk[name] && (
          <span className="meta-exists">
            Existing values : {this.state.existingMetaBulk[name]}
          </span>
        )}
      </div>
    );
  }

  render() {
    return (
      <Modal
        isOpen={this.props.open}
        onRequestClose={this.handleClose}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h2>
          <i aria-hidden="true" className="icon icon-edit icon-xl" />
          Edit Metatag
        </h2>

        <div className="modal-content">
          <Form error success loading={this.state.loading}>
            {this.state.error ? (
              <Message error content={this.state.message} />
            ) : (
              <Message success content={this.state.message} />
            )}

            {this.buildFieldForm('title', 'Title', 'Title')}
            {this.buildFieldForm('artist', 'Artist', 'Artist')}
            {this.buildFieldForm('album', 'Album', 'Album')}
            {this.buildFieldForm('albumartist', 'Album Artist', 'Album Artist')}
            {this.buildFieldForm('year', 'Year', 'Year', 'number')}
            {this.buildFieldForm('genre', 'Genre', 'Genre')}
            {this.buildFieldForm('composer', 'Composer', 'Composer')}
            {this.buildFieldForm('trackno', 'Track n°', 'Track n°', 'number')}
            {this.buildFieldForm('trackof', 'Track of', 'Track of', 'number')}
            {this.buildFieldForm('diskno', 'Disk n°', 'Disk n°', 'number')}
            {this.buildFieldForm('diskof', 'Disk of', 'Disk of', 'number')}

            <div className="form-row">
              <ul className="unstyled">
                <li>
                  <input
                    id="updateDBES"
                    name="updateDBES"
                    className="checkbox"
                    type="checkbox"
                    checked={this.state.saveCheckBox.updateDBES}
                    onChange={this.handleChangeCheckBox}
                  />
                  <label htmlFor="updateDBES">Save meta in DataBase</label>
                </li>
                <li>
                  <input
                    name="updateFiles"
                    className="checkbox"
                    type="checkbox"
                    checked={this.state.saveCheckBox.updateFiles}
                    onChange={this.handleChangeCheckBox}
                  />
                  <label htmlFor="updateFiles">Save meta in files</label>
                </li>
              </ul>
            </div>
          </Form>
        </div>
        <div className="modal-actions">
          <button
            onClick={this.handleClose}
            className="btn btn-no btn-inverted modal-btn"
          >
            <i aria-hidden="true" className="icon icon-x modal-btn-icon" />
            No
          </button>
          <button
            type="submit"
            onClick={this.submitForm}
            className="btn btn-yes btn-inverted modal-btn"
          >
            <i aria-hidden="true" className="icon icon-check modal-btn-icon" />
            Yes
          </button>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.authenticationStore._user
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateNode: item => dispatch(put('nodes/' + item._id + '/meta', { data: item })),

    fetchFiles: query => dispatch(get(`nodes/q/files?path=${query || ''}`))
  };
};

const EditMetaTagContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(EditMetaTag);

export default EditMetaTagContainer;

// HELPER
function initMetaWrap(stringType, value) {
  let generate;
  if (stringType === 'array') {
    generate = () => [];
  } else if (stringType === 'object') {
    generate = () => {};
  } else if (stringType === 'boolean') {
    generate = () => (value ? value : false);
  } else {
    generate = () => (value ? value : '');
  }
  return {
    title: generate(),
    artist: generate(),
    album: generate(),
    albumartist: generate(),
    year: generate(),
    genre: generate(),
    composer: generate(),
    trackno: generate(),
    trackof: generate(),
    diskno: generate(),
    diskof: generate()
  };
}

function initMeta(meta) {
  if (meta) {
    return {
      title: meta.title || '',
      artist: meta.artist || '',
      album: meta.album || '',
      albumartist: meta.albumartist || '',
      year: meta.year || '',
      genre: meta.genre ? meta.genre.join(', ') : '',
      composer: meta.composer || '',
      trackno: meta.trackno || '',
      trackof: meta.trackof || '',
      diskno: meta.diskno || '',
      diskof: meta.diskof || ''
    };
  }

  return initMetaWrap('string');
}

function initBulkMeta() {
  return initMetaWrap('array');
}

function initInput() {
  return initMetaWrap('boolean');
}

function initMetaAction() {
  // donothing, override, remove, add
  return initMetaWrap('string', 'donothing');
}

/**
 * Giving a string return an array split by , ; /
 * If the input is not a string return it
 *
 * @param str
 * @returns {*}
 */
function checkStringReturnArray(str) {
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
function changeEmptyValInArray(arr, replacer, first) {
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
function uniq(arr) {
  return [...new Set(arr)];
}

function cleanMeta(meta) {
  let cleanMeta = Object.assign({}, meta);

  cleanMeta.genre = checkStringReturnArray(cleanMeta.genre);

  return cleanMeta;
}
