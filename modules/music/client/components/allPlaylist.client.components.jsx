import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { get, post } from 'core/client/services/core.api.services'
import socketServices from 'core/client/services/core.socket.services'
import MenuPlay from 'music/client/components/playList/menuPlay.client.components'
import AddPlaylist from 'music/client/components/playList/addPlaylist.client.components'
import { activatePlaylist, playOnPlaylist, pauseState, playState } from 'music/client/redux/actions'


class AllPlaylist extends Component {
  constructor (props) {
    super(props);
    this.socket = socketServices.getPublicSocket();

    this.handlerAddTracks = this.handlerAddTracks.bind(this);
    this.handlerOnPlay = this.handlerOnPlay.bind(this);

    this.state = {
      allPlaylist: []
    }
  }

  componentWillMount () {
    const _self = this;
    const { user } = this.props;
    const username = user ? user.username : '';

    // Get all playlist.
    this.props.getAllPlaylist()
      .then((data) => {
        if (data.success) {
          _self.setState({ allPlaylist: data.msg });
        }
      });

    // Socket connexion.
    this.socket.on('save:playlist', (data) => {
      const apl = updateAllPlaylist(_self.state.allPlaylist, data);
      _self.setState({ allPlaylist: apl })
    });
  }

  // Update Playlists list if user connexion move.
  componentWillReceiveProps (nextProps) {
    if (this.props.user !== nextProps.user) {
      const _self = this;

      // If user connected, get all with default playlist.
      if (nextProps.user) {
        this.props.getAllPlaylist()
          .then((data) => {
            if (data.success) {
              _self.setState({ allPlaylist: data.msg });
            }
          });
      }

      // No user, delete default playlist.
      else {
        const apl = deleteDefaultPlaylist(_self.state.allPlaylist);
        _self.setState({ allPlaylist: apl });
      }
    }
  }

  handlerOnPlay (e, item) {
    e.preventDefault();
    e.stopPropagation();

    const _self = this;
    const pl = item;

    const { playingList, onPauseFunc, onPlayFunc } = this.props;
    const isPlaying = playingList.pl && (playingList.pl.title === item.title);

    //@todo do something for pl have always an id
    // and remove comparison with title
    // this after that
    if (
      (playingList.pl && playingList.pl.title === pl.title)
    ) {
      if (isPlaying) return onPauseFunc();
      return onPlayFunc();

    }
    else {
      this.props.getPlaylist(pl.title)
        .then((data) => {
          if (data.success) {
            _self.props.onPlay({
              pl: data.msg,
              onPlayIndex: 0
            });
          }
        });
    }
  }

  handlerAddTracks(e, item){
    e.preventDefault();

    const { user, history, location } = this.props;


    // User must be connected to add tracks.
    if (!user) return history.push({pathname: '/login', state: {from: location.pathname }});


    this.props.activatePlaylist(item);
    this.props.history.push('/music');
  }

  // On unmount component, disconnect Socket.io.
  componentWillUnmount () {
    this.socket.disconnect();
    console.log('Disconnecting Socket as component will unmount');
  }

  render () {
    const { allPlaylist } = this.state;
    const { history, user, playingList } = this.props;

    const getAuthor = function (item) {
      if (!item.author) {
        return 'Created by anonyme';
      }
      else {
        return `Created by ${item.author.username}`;
      }
    };

    const playLists = allPlaylist.map((item, i) => {
      let title;
      let path;
      let author;
      let isAuthor;

      if (!item.defaultPlaylist) {
        title = item.title;
        path = `/playlist/${item.title}`;
        author = getAuthor(item);
        isAuthor = (user && item.author && item.author.username === user.username);
      } else {
        title = 'Queue';
        path = '/queue';
        author = user ? `${user.username}'s tracks queue` : '';
        isAuthor = true;
      }

      const isPlaying = playingList.pl && (playingList.pl.title === item.title);
      const classes = ['allpl-li'];
      if( isPlaying ) classes.push('is-playing');

      return (
        <li className={classes.join(' ')} key={i}>
        {(item.length !== 0) &&
            <div className='allpl-a' onClick={e => this.handlerOnPlay(e, item)} aria-label={`Play playlist ${title}`}>
              <div className='allpl-img-wrapper'>
                <span className='allpl-img-inner'/>
                <span className='allpl-img-overlay'/>
                <MenuPlay playlist={item}/>
              </div>
              <div className='allpl-title'>{title}</div>
              <div className='allpl-author'>{author}</div>
              <div className='allpl-tracks'>{item.length} tracks</div>
              {isAuthor &&
              <button title='Add tracks' onClick={e => this.handlerAddTracks(e, item)} className='btn btn-icon medium'>
                <i aria-hidden='true' className='icon icon-plus'/>
              </button>
              }
              <Link to={path} onClick={(e) => e.stopPropagation()} title='to playlist page' className='btn btn-icon medium'>
                <i aria-hidden='true' className='icon icon-eye'/>
              </Link>
            </div>
        }{(item.length === 0) &&
          <div className='allpl-noa'>
            <div className='allpl-img-wrapper'>
              <span className='allpl-img-inner'/>
              <span className='allpl-img-overlay'/>
              {isAuthor &&
                <button title='Add tracks' onClick={e => this.handlerAddTracks(e, item)}
                        className='menu-add btn btn-icon big'>
                  <i aria-hidden='true' className='icon icon-plus big'/>
                </button>
              }
            </div>
            <div className='allpl-title'>{title}</div>
            <div className='allpl-author'>{author}</div>
            <div className='allpl-tracks'>{item.length} tracks</div>
            {isAuthor &&
            <button title='Add tracks' onClick={e => this.handlerAddTracks(e, item)} className='btn btn-icon medium'>
              <i aria-hidden='true' className='icon icon-plus'/>
            </button>
            }
            <Link to={path} title='to playlist page' className='btn btn-icon medium'>
              <i aria-hidden='true' className='icon icon-eye'/>
            </Link>
          </div>
        }
        </li>
      );
    });

    return (
      <section className='pal allpl'>
        <header>
          <h1>Playlists</h1>
          <AddPlaylist history={history} />
        </header>
        <div className='content-wrapper w-max-xl center'>
          <ul className='grid-target unstyled grid-3 has-gutter-xl'>
            {playLists}
          </ul>
        </div>
      </section>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.authenticationStore._user,
    playingList: state.playlistStore.playingList
  }
};

const mapDispatchToProps = dispatch => {
  return {
    createPlaylist: (item) => dispatch(
      post('playlist', {data: item})
    ),
    getAllPlaylist: () => dispatch(
      get(`playlist`)
    ),
    getPlaylist: (title) => dispatch(
      get(`playlist/${title}`)
    ),
    activatePlaylist: (item) => dispatch(
      activatePlaylist(item)
    ),
    onPlay: (item) => dispatch(
      playOnPlaylist(item)
    ),
    onPauseFunc: () => dispatch(
      pauseState()
    ),
    onPlayFunc: () => dispatch(
      playState()
    )
  }
};

const AllPlaylistContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AllPlaylist);


// HELPER
function updateAllPlaylist (arr, item) {
  const array = arr.slice(0);

  for (let i = 0; i < array.length; i++) {
    if (item.title === array[i].title) {
      array[i] = item;
      return array;
    }
  }
  array.push(item);
  return array;
}

// function updateDefaultPlaylist(arr, item) {
//   const array = arr.slice(0);
//
//   for (let i = 0; i < array.length; i++) {
//     if (array[i].defaultPlaylist) {
//       array[i] = item;
//       return array;
//     }
//   }
//   array.unshift(item);
//   return array;
// }

function deleteDefaultPlaylist (arr) {
  const array = arr.slice(0);

  for (let i = 0; i < array.length; i++) {
    if (array[i].defaultPlaylist) {
      array.splice(i, 1);
      return array;
    }
  }
  return array;
}

export default AllPlaylistContainer
