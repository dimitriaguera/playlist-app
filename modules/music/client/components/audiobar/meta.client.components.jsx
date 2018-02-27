import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import style from './style/meta.scss'

class MetaInfoPlaylist extends Component {
  shouldComponentUpdate (nextProps) {
    const { onPlayIndex, pl } = nextProps;
    return (pl !== this.props.pl || onPlayIndex !== this.props.onPlayIndex);
  }

  render () {
    const { pl, onPlayIndex, mode, onPlay } = this.props;

    if (pl) {
      let title = pl.title;
      let path = getActiveModePath(mode);
      let modeLabel = mode === 'folder' ? 'folder tracks' : mode;

      // If pl is album, use folder path to construct link path.
      if (mode === 'album') {
        path += `/${pl.tracks[0].albumKey}`;
      }

      // Else if pl is Queue.
      else if (pl.defaultPlaylist) {
        title = title.replace('__def', '');
        path = '/queue';
        modeLabel = 'queue';
      }

      // Else, pl is playlist, just construct link path with title.
      else {
        path += `/${title}`;
      }

      return (
        <div className='audioBar-coll audioBar-meta'>
          <Link to={path} className='audioBar-info-label'>{`${modeLabel} ${onPlayIndex + 1}/${pl.tracks.length}`}</Link>
          <div className='audioBar-info-name'>{title || onPlay.name}</div>
          {onPlay.meta && onPlay.meta.artist && <div className='audioBar-info-artist'>{onPlay.meta.artist}</div>}
          {onPlay.meta && onPlay.meta.year && <div className='audioBar-info-artist'>{onPlay.meta.year}</div>}
        </div>
      );
    }
    return null;
  };
}

// HELPER

function getActiveModePath (mode) {
  switch (mode) {
    case 'playlist':
      return '/playlist';

    case 'folder':
      return '/list/folder';

    case 'album':
      return '/album';

    default:
      return '/playlist';
  }
}

export default MetaInfoPlaylist
