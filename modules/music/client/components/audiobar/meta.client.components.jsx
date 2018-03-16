import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import ps from "../../../../core/client/services/core.path.services"

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

    let title = '';
    let path = '#';
    let modeLabel = mode === 'folder' ? 'folder tracks' : mode;

    if (pl) {
      // If pl is album, use folder path to construct link path.
      if (mode === 'album') {
        path = `/album/${pl.tracks[0].albumKey}`;
      }

      // Else if pl is Queue.
      else if (pl.defaultPlaylist) {
        title = title.replace('__def', '');
        path = '/queue';
        modeLabel = 'queue';
      }

      // Else, pl is playlist, just construct link path with title.
      else {
        path = `/playlist/${pl.title}`;
      }
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

          <div className='audioBar-info-name'>
            {getTrackTitle()}
          </div>

          {onPlay.meta && onPlay.meta.album &&
            <div className='audioBar-info-album'>
              {onPlay.meta.album }
            </div>
          }

          {onPlay.meta && onPlay.meta.artist &&
            <div className='audioBar-info-artist'>
              {onPlay.meta.artist || onPlay.meta.albumartist}
            </div>
          }
          {onPlay.meta && onPlay.meta.year &&
            <div className='audioBar-info-artist'>
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
