/**
 * Folder is the file explorator component.
 * The folder's path to open is get with component URL, via react-router v4.
 *
 * For example :
 * ----> http://my.example.com/music/Brassens
 * will call component to display /Brassens folder's content.
 * ----> http://my.example.com/music/amy_winhouse/bestOf/theBest
 * will call component to display /amy_winhouse/bestOf/theBest folder's content.
 *
 */

import React, { Component } from 'react'
import { connect } from 'react-redux'
import ps from 'core/client/services/core.path.services'
import socketServices from 'core/client/services/core.socket.services'
import { get, post } from 'core/client/services/core.api.services'

import { playItem, addFolderToPlay, pauseState, playState} from 'music/client/redux/actions'

import Modal from 'react-modal';

import EditMetaTag from 'music/client/components/editMetaTag/editMetaTag.client.components'
import IndexableFolderItem from './indexableFolderItem.client.components'

// import SearchFolderBar from './SearchFolderBar.client.components'

class IndexableFolder extends Component {
  constructor () {
    super();

    this.handleModalOpen = this.handleModalOpen.bind(this);
    this.handleModalCancel = this.handleModalCancel.bind(this);
    this.handleModalConfirm = this.handleModalConfirm.bind(this);
    this.handlerGetAllFiles = this.handlerGetAllFiles.bind(this);
    this.handlerOpenFolder = this.handlerOpenFolder.bind(this);
    this.handlerRootFolder = this.handlerRootFolder.bind(this);
    this.handlerReadFile = this.handlerReadFile.bind(this);
    this.handlerAddItem = this.handlerAddItem.bind(this);
    this.handlerPlayFolder = this.handlerPlayFolder.bind(this);
    this.onListTracks = this.onListTracks.bind(this);
    this.handlerClickOnFile = this.handlerClickOnFile.bind(this);


    this.onEditMetaTag = this.onEditMetaTag.bind(this);

    this.updateNodeMetaOnSocketEvent = this.updateNodeMetaOnSocketEvent.bind(this);

    this.socket = socketServices.getPublicSocket();

    this.state = {
      path: [],
      query: null,
      search: null,
      nodes: [],
      error: false,
      modal: {
        open: false,
        addTracks: []
      },
      showEditMetaTagModal: false,
      editMetaTagItem: null
    }
    ;
  }


  componentWillMount () {
    const _self = this;
    const { fetchFolder, searchNodes, location, match } = _self.props;

    // React Modal
    Modal.setAppElement("#root");

    // Update node when someone change meta
    // on Socket Event
    _self.socket.on('save:meta', _self.updateNodeMetaOnSocketEvent);

    // TODO a simplifier. Sert à récupérer via url query la playlist à activer dès le chargement du component. Ne devrait pas être l'affaire de ce component.
    const params = new URLSearchParams(location.search.substring(1));
    const term = params.get('search');

    // If search param, only display result.
    if (term) {
      return searchNodes(term).then((data) => {
        if (!data.success) {
          _self.setState({ error: true, params: params });
        }
        else {
          const nodes = data.msg.hits.hits.map((item) => item._source);
          _self.setState({
            error: false,
            nodes: nodes,
            search: term,
            params: params
          });
        }
      });
    }

    // Extract folder's path to url.
    const path = ps.cleanPath(ps.removeRoute(location.pathname, match.path));

    // Get folder's content.
    function fetch () {
      fetchFolder(ps.urlEncode(path)).then((data) => {
        if (!data.success) {
          _self.setState({ error: true, params: params });
        }
        else {
          _self.setState({
            error: false,
            nodes: data.msg,
            params: params,
            query: path,
            path: ps.splitPath(path)
          });
        }
      });
    }

    return fetch()
  }

  // Re-render only if path array or modal state are modified.
  shouldComponentUpdate (nextProps, nextState) {
    const { activePlaylist, pause, onPlay} = nextProps;
    const { query, modal, nodes } = nextState;
    return (
      query !== this.state.query ||
      modal !== this.state.modal ||
      nodes !== this.state.nodes ||
      nextState.showEditMetaTagModal !== this.state.showEditMetaTagModal ||
      activePlaylist !== this.props.activePlaylist ||
      pause !== this.props.pause ||
      onPlay._id !== this.props.onPlay._id
    );
  }

  // Force re-rendering on props location change.
  componentWillReceiveProps (nextProps) {
    const _self = this;
    const { location, match } = nextProps;

    // TODO a simplifier. Sert à récupérer via url query la playlist à activer dès le chargement du component. Ne devrait pas être l'affaire de ce component.
    const params = new URLSearchParams(location.search.substring(1));
    const term = params.get('search');

    // If search param, only display result.
    if (term && term !== this.state.search) {
      return this.props.searchNodes(term).then((data) => {
        if (!data.success) {
          _self.setState({ error: true, params: params });
        }
        else {
          const nodes = data.msg.hits.hits.map((item) => item._source);
          _self.setState({
            error: false,
            nodes: nodes,
            query: null,
            search: term,
            params: params
          });
        }
      });
    }

    // Extract folder's path form url.
    const path = ps.cleanPath(ps.removeRoute(location.pathname, match.path));

    if (path !== this.state.query) {
      // Query folder content, and set new state.
      // This start re-render component with folder content.
      this.props.fetchFolder(ps.urlEncode(path)).then((data) => {
        if (!data.success) {
          _self.setState({error: true});
        }
        else {
          _self.setState({
            error: false,
            nodes: data.msg,
            query: path,
            search: null,
            path: ps.splitPath(path)
          });
        }
      });
    }
  }

  componentWillUnmount () {
    this.socket.removeListener('save:meta', this.updateNodeMetaOnSocketEvent);
  }

  updateNodeMetaOnSocketEvent (data) {
    let oldNode = Object.assign([], this.state.nodes);

    // Find oldNode corresponding of newNode
    // And update the meta
    let i = 0, li = oldNode.length, j = 0, lj = data.length;

    for (; i < li; i++) {
      for (; j < lj; j++) {
        if (oldNode[i]._id === data[j]._id) {
          oldNode[i].meta = data[j].meta;
        }
      }
    }

    this.setState({
      nodes: oldNode
    });
  }

  // Handle func when open Confirm Box.
  handleModalOpen (tracks) {
    this.setState({modal: {
      open: true,
      addTracks: tracks
    }});
  }

  // Handle for cancel Confirm Box.
  handleModalCancel () {
    this.setState({modal: {
      open: false,
      addTracks: []
    }});
  }

  // Handle for confirm Confirm Box.
  handleModalConfirm () {
    const tracks = this.state.modal.addTracks.map((file) => {
      return file._id
    });

    this.handlerAddItem(null, tracks);
    this.setState({modal: {
      open: false,
      addTracks: []
    }});
  }

  // Handler to get all files recursively in a folder.
  handlerGetAllFiles (e, item) {

    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const _self = this;
    const {fetchFiles} = this.props;

    fetchFiles(ps.urlEncode(item.path)).then((data) => {
      if (!data.success) {
        _self.setState({ error: true });
      }
      else {
        this.handleModalOpen(data.msg);
      }
    });
    e.preventDefault();
  }

  // Handler onClick on a folder link.
  // Return list a folder content.
  handlerOpenFolder (e, path) {
    const { history } = this.props;

    // Update component via url update.
    history.push(`/music/${path}`);
    e.preventDefault();
  }

  // Handler that return root folder content.
  handlerRootFolder (e) {
    const { history } = this.props;

    // Update component via url update.
    history.push(`/music`);
    e.preventDefault();
  }

  // Handler to looks at files as tracks list.
  onListTracks (e, item) {

    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const { history } = this.props;

    // Go to album display mode.
    history.push(`/list/folder/${item.path}`);
    e.preventDefault();
  }

  // Handler to play music file.
  handlerReadFile (e, item) {

    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const { pause, onPlay, onPauseFunc, onPlayFunc } = this.props;

    if (onPlay._id === item._id) {
      if (pause) {
        return onPlayFunc();
      } else {
        return onPauseFunc();
      }
    }

    // Change global state to start playing track.
    this.props.readFile(item);

  }

  onEditMetaTag (e, item) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    this.setState({editMetaTagItem: item, showEditMetaTagModal: true});
  }

  // Handler to add single track on playlist.
  handlerAddItem (e, item) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const { user, history, activePlaylist, addPlaylistItems, location } = this.props;

    // User must be connected to add tracks.
    if (!user) return history.push({pathname: '/login', state: { from: location.pathname }});

    // May be an array of several tracks.
    let tracks = item;

    // If just one item, build array with only one track.
    if (!Array.isArray(tracks)) {
      tracks = [item._id];
    }

    // Add tracks into activated Playlist.
    if (activePlaylist) addPlaylistItems(activePlaylist.title, {tracks: tracks});
  }

  // Handler to add recursively all tracks on playlist.
  handlerPlayFolder (e, item) {

    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const _self = this;
    const {fetchFiles, addFolderToPlay} = this.props;


    fetchFiles(ps.urlEncode(item.path)).then((data) => {
      if (!data.success) {
        _self.setState({ error: true });
      }
      else {
        const folder = {
          pl: {
            title: item.name,
            path: item.path,
            tracks: data.msg
          }
        };
        addFolderToPlay(folder);
      }
    });
  }

  // Click on folder or file element.
  handlerClickOnFile (e, item) {
    if (item.isFile) {
      return this.handlerReadFile(e, item);
    }

    this.handlerOpenFolder(e, item.path);
  }


  render () {
    const { nodes, path, error, modal } = this.state;
    const { activePlaylist } = this.props;

    let activePlaylistTitle = '';
    if (activePlaylist) {
      //  activePlaylist.defaultPlaylist => activePlaylist.publicTitle || activePlaylist.title;
      activePlaylistTitle = activePlaylist.publicTitle || activePlaylist.title;
    }

    return (
        <section>
          <header>
            <h1>Music Folders</h1>
            <Bread path={path} handlerOpenFolder={this.handlerOpenFolder} handlerRootFolder={this.handlerRootFolder} />
          </header>

          {(!error) &&
          <ul className='unstyled'>
            {nodes.map((item, i) => {
              return (
                <IndexableFolderItem
                  key={i}
                  item={item}
                  onClick={this.handlerClickOnFile}
                  onGetFiles={this.handlerGetAllFiles}
                  onAddItem={this.handlerAddItem}
                  onPlayFolder={this.handlerPlayFolder}
                  onListTracks={this.onListTracks}
                  onEditMetaTag={this.onEditMetaTag}
                  onPlayTrackId={this.props.onPlay._id}
                  pause={this.props.pause}
                />
              )
            })}
          </ul>
          }

          {this.state.showEditMetaTagModal &&
          <EditMetaTag
            open={this.state.showEditMetaTagModal}
            item={this.state.editMetaTagItem}
            onClose={() => this.setState({showEditMetaTagModal: false})}
          />
          }

          <Modal
            isOpen={modal.open}
            onRequestClose={this.handleModalCancel}
            className="modal"
            overlayClassName="modal-overlay"
          >

             <h2 className="modal-title">
               <i aria-hidden="true" className="icon icon-edit icon-xl"/>
               {`Add ${modal.addTracks.length} tracks ?`}
             </h2>

              <div className="modal-content">
                <p>{`Do you want to add all those tracks on ${activePlaylistTitle} playlist ?`}</p>
              </div>

              <div className="modal-actions">
                <button onClick={this.handleModalCancel} className="btn btn-no btn-inverted modal-btn">
                  <i aria-hidden="true" className="icon icon-x modal-btn-icon" />No
                </button>
                <button onClick={this.handleModalConfirm} className="btn btn-yes btn-inverted modal-btn">
                  <i aria-hidden="true" className="icon icon-check modal-btn-icon" />Yes
                </button>
              </div>


          </Modal>
        </section>
      );
    }
}

const mapStateToProps = state => {
  return {
    user: state.authenticationStore._user,
    activePlaylist: state.playlistStore.activePlaylist,
    onPlay: state.playlistStore.onPlay,
    pause: state.playlistStore.pause
  }
};

const mapDispatchToProps = dispatch => {
  return {
    fetchFolder: (query) => dispatch(
      get(`nodes/q/child?path=${query || ''}`)
    ),

    searchNodes: (query) => dispatch(
      get(`search/album?search=${query || ''}`)
    ),
    fetchFiles: (query) => dispatch(
      get(`nodes/q/files?path=${query || ''}`)
    ),
    addPlaylistItems: (title, items) => dispatch(
      post(`playlist/${title}`, {
        data: items
      })
    ),
    addFolderToPlay: (item) => {
      // Search first track on list.
      const track = item.pl.tracks[0];
      // Add album to store.
      dispatch(addFolderToPlay(item));
      // If track, play it.
      if (track) dispatch(playItem(track));
    },
    readFile: (item) => dispatch(
      playItem(item)
    ),
    onPauseFunc: () => dispatch(
      pauseState()
    ),
    onPlayFunc: () => dispatch(
      playState()
    )
  }
};

const IndexableFolderContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(IndexableFolder);

//// Helper
function Bread ({ path, handlerOpenFolder, handlerRootFolder }) {

  const l = path.length;

  return (
    <nav>
      <ul className="unstyled breadcrumb-ul flex-container">
        <li key='0' className="breadcrumb-li" style={{'cursor': 'pointer'}}>
          <a href="#" onClick={handlerRootFolder} title='Home' className="breadcrumb-a">
            <i aria-hidden="true" className='icon icon-home icon-m' />
            { (l>0) && <i aria-hidden="true" className='icon icon-chevron-right icon-m' />}
          </a>
        </li>
        {path.map((item, i) => {
              // Check if not last item
              if (l !== i + 1) {
                return (
                  <li key={i+1} className="breadcrumb-li" style={{'cursor': 'pointer'}}>
                    <a href="#" title={item} className="breadcrumb-a" onClick={(e) => handlerOpenFolder(e, ps.buildPath(path.slice(0, i + 1)))}>
                      {item}
                      <i aria-hidden="true" className='icon icon-chevron-right icon-m' />
                    </a>

                  </li>
                );
              } else {
                return (
                  <li key={i+1} className="breadcrumb-li">
                    <span title={item} className="breadcrumb-a">
                      {item}
                    </span>
                  </li>
                );
              }


            })}
      </ul>
    </nav>
  )
}

export default IndexableFolderContainer
