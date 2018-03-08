import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'core/client/services/core.api.services'
import { activatePlaylist } from 'music/client/redux/actions'
import { Link } from 'react-router-dom'
import Select from 'react-select';
import 'react-select/dist/react-select.css';

class SelectPlaylist extends Component {
  constructor (props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      allPlaylist: []
    }
  }

  componentWillMount () {
    const _self = this;
    this.props.getAllPlaylistName()
      .then((data) => {
        if (data.success) {
          const {activePlaylist, defaultValue} = _self.props;
          _self.setState({ allPlaylist: data.msg });

          if (defaultValue) {
            let pl = getValue(defaultValue, _self.state.allPlaylist);
            pl = pl || _self.state.allPlaylist[0];
            _self.props.activatePlaylist(pl);
          }
          else if (!activePlaylist) {
            _self.props.activatePlaylist(_self.state.allPlaylist[0]);
          }
        }
      });
  }

  handleChange (data) {
    this.props.getOnePlaylist(data.value)
      .then(rps => {
        if (rps.success) {
          this.props.activatePlaylist(rps.msg);
        }
      });
  }

  render () {
    const { allPlaylist } = this.state;
    const { activePlaylist } = this.props;

    const defaultValue = activePlaylist ? activePlaylist.title : null;

    const playlistOptions = allPlaylist.map((pl) => {
      const title = pl.publicTitle || pl.title;
      return {
        key: pl.title,
        value: pl.title,
        label: title
      }
    });

    let activePlaylistTitle = '';
    let pathUrl = '';
    if (activePlaylist) {
      if (activePlaylist.defaultPlaylist) {
        activePlaylistTitle = activePlaylist.publicTitle;
        pathUrl = '/queue'
      }
      else {
        activePlaylistTitle = activePlaylist.title;
        pathUrl = `/playlist/${activePlaylist.title}`;
      }
    }

    return (
      <section className='select-playlist'>

        {activePlaylist &&
        <Link to={pathUrl} title='Go to active playlist' className='select-playlist-label'>
            <span className='select-playlist-label-name'>Playlist active</span>
            {`${activePlaylist.length} tracks`}
        </Link>
        }

        <Select
          placeholder='Select your playlist'
          aria-describedby='Choose the active playlist here'
          onChange={this.handleChange}
          value={defaultValue}
          options={playlistOptions}
          clearable={false}
        />

      </section>

    );
  }
}

const mapStateToProps = state => {
  return {
    activePlaylist: state.playlistStore.activePlaylist
  }
};

const mapDispatchToProps = dispatch => {
  return {
    activatePlaylist: (item) => dispatch(
      activatePlaylist(item)
    ),
    getAllPlaylistName: () => dispatch(
      get('ownedPlaylist')
    ),
    getOnePlaylist: (plTitle) => dispatch(
      get('playlist/' + plTitle)
    )
  }
};

const SelectPlaylistContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectPlaylist);


// HELPER
function getValue (value, array) {
  for (let i = 0; i < array.length; i++) {
    if (array[i].title === value) {
      return array[i];
    }
  }
  return null;
}

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


export default SelectPlaylistContainer
