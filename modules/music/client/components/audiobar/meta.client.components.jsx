import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import ps from "core/client/services/core.path.services"

import Img from 'music/client/components/image/image.client.components'
import defaultCover from 'assets/images/default_cover.png'


class MetaInfoPlaylist extends Component {

  shouldComponentUpdate (nextProps) {
    const { onPlayIndex, pl, onPlay } = nextProps;
    return (pl !== this.props.pl || onPlayIndex !== this.props.onPlayIndex.path || onPlay !== this.props.onPlay.path);
  }

  render () {
    const { pl, onPlayIndex, mode, onPlay } = this.props;

    const cover = onPlay.albumKey ? ps.changeSeparator(onPlay.albumKey, '___', '/') : null;

  let title='', path='', modeLabel='';

    // Album
    if (mode === 'album') {
      title = pl.tracks[0].meta.album;
      path = `/album/${onPlay.albumKey}`;
      modeLabel = 'Album';
    }

    // Pl
    else if (mode === 'playlist') {

      if (pl.defaultPlaylist) {
        title = pl.title.replace('__def', '');
        path = '/queue';
        modeLabel = 'Queue';
      } else {
        title = pl.title;
        path = `/playlist/${pl.title}`;
        modeLabel = 'Playlist';
      }
    }
    else if (mode === 'folder') {
      modeLabel = 'folder';
      path = '/music/' + ps.removeLast(onPlay.path);
    }

    else if (mode === 'track') {
      modeLabel = 'track';
      path = onPlay.albumKey ? '/album/' + onPlay.albumKey : '/music/' + ps.removeLast(onPlay.path);
    }


    function getTrackTitle(){
      if (onPlay.meta.title !== '') return onPlay.meta.title;
      return onPlay.publicName;
    }

    return (
      <Link to={path} className={`${this.props.className} audioBar-wrap-meta`}>
        <div className='audioBar-img'>
            <Img title={`${onPlay.publicName} cover`}
                 src={'/pictures/' + cover + '/cover.jpg'}
                 defaultSrc={defaultCover}
            />
        </div>

        <div className='audioBar-meta'>

          {/*<div className='audioBar-info-label'>{`${modeLabel} ${onPlayIndex + 1}/${pl.tracks.length}`}</div>*/}

          {/*<div className='audioBar-info-label' title='Mode'>*/}
            {/*{modeLabel}*/}
          {/*</div>*/}

          <div className='audioBar-info-title' title='Track title'>
            <i aria-hidden="true" className='icon icon-eye'/> {getTrackTitle()}
          </div>

          {onPlay.meta && onPlay.meta.album &&
            <div className='audioBar-info-album' title='Album name'>
              {onPlay.meta.album }
            </div>
          }

          {onPlay.meta && onPlay.meta.artist &&
            <div className='audioBar-info-artist' title='Artist'>
              {onPlay.meta.artist || onPlay.meta.albumartist}
            </div>
          }
          {onPlay.meta && onPlay.meta.year &&
            <div className='audioBar-info-year' title='Year'>
              {onPlay.meta.year}
            </div>
          }
        </div>

      </Link>
    );

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
