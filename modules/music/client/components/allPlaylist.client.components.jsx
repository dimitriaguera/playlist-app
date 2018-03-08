import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { get, post } from 'core/client/services/core.api.services'
import socketServices from 'core/client/services/core.socket.services'
import MenuPlay from 'music/client/components/playList/menuPlay.client.components'
import AddPlaylist from 'music/client/components/playList/addPlaylist.client.components'
import {activatePlaylist} from 'music/client/redux/actions';

class AllPlaylist extends Component {
  constructor (props) {
    super(props);
    this.socket = socketServices.getPublicSocket();

    this.handlerAddTracks = this.handlerAddTracks.bind(this);

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

  handlerAddTracks(e, item){
    e.preventDefault();
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
    const { history, user } = this.props;

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
        isAuthor = (user && item.author.username === user.username);
      } else {
        title = 'Queue';
        path = '/queue';
        author = user ? `${user.username}'s tracks queue` : '';
        isAuthor = true;
      }

      return (
          <li className='allpl-li' key={i}>
            <Link className='allpl-a' to={path} title={`Go to Playlist ${title}`}>
              <span className='allpl-title'>{title}</span>
              <span className='allpl-tracks'><i aria-hidden="true" className="icon icon-music" />{item.length} tracks</span>
              <span className='allpl-author'>{author}</span>
              {isAuthor &&
                <button title='Add tracks' onClick={(e) => this.handlerAddTracks(e, item)} className='btn'>Add tracks</button>
              }
                {/*<MenuPlay playlist={item} />*/}
            </Link>
          </li>
      );
    });

    return (
      <section className='allpl pal'>
        <header>
          <h1>Playlists</h1>
          <AddPlaylist history={history} />
        </header>
        <ul className='unstyled allpl-ul'>
          {playLists}
        </ul>
      </section>
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
    createPlaylist: (item) => dispatch(
      post('playlist', {data: item})
    ),
    getAllPlaylist: () => dispatch(
      get(`playlist`)
    ),
    activatePlaylist: (item) => dispatch(
      activatePlaylist(item)
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
