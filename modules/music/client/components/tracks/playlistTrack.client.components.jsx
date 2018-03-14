import React, { Component } from 'react'
import ps from 'core/client/services/core.path.services'
import IconPlayAnim from 'music/client/components/iconPlayAnim/iconPlayAnim.client.components'
import { getAlbumKeyFromTrackNodeMeta, normalizedMeta } from 'indexableFolder/server/services/indexableFolder.key.services'

class PlaylistTrack extends Component {
  constructor(props) {
    super(props);
    this.toAlbumPage = this.toAlbumPage.bind(this);
  }

  shouldComponentUpdate (nextProps) {
    const nextActive = nextProps.isActivePlaylist && (nextProps.index === nextProps.onPlayIndex);
    const active = this.props.isActivePlaylist && (this.props.index === this.props.onPlayIndex);

    return (
      this.props.item !== nextProps.item ||
            this.props.index !== nextProps.index ||
            this.props.canEdit !== nextProps.canEdit ||
            active !== nextActive ||
            (active && this.props.isPaused !== nextProps.isPaused)
    )
  }

  toAlbumPage(e){
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const key = ps.urlEncode(getAlbumKeyFromTrackNodeMeta(ps, normalizedMeta(this.props.item)));
    this.props.history.push(`/album/${key}`);
  }

  render () {
    const {
      item, onPlay, onDelete, canEdit, index, isPaused, onPlayIndex, isActivePlaylist
    } = this.props;

    const active = isActivePlaylist && (index === onPlayIndex);

    let classes = ['move-playlist-tracks-items-row'];
    if (active) classes.push('active');
    if (canEdit) classes.push('edit');

    const artist = item.meta.artist ? item.meta.artist : item.meta.albumartist;

    return (
      <div aria-label='play track' className={classes.join(' ')} onClick={onPlay(index)} draggable='false'>

        <Prefix active={active} isPaused={isPaused} index={index}/>

        <span className='title'>{item.meta.title || item.publicName}</span>
        {artist && <span className='artist'>{artist}</span>}
        {item.meta.album && <a href={'#'} onClick={this.toAlbumPage} className='album'>{item.meta.album}</a>}
        {item.meta.time && <span className='time'>{item.meta.time}</span>}

        {canEdit &&
          <span className='tracks-item-menu'>
            <button className='btn' onClick={onDelete(index)}>
              <i aria-hidden="true" className="icon icon-x" />
            </button>
          </span>
        }
      </div>
    );
  }
}

const Prefix = ({active, isPaused, index}) => {

  if( active ) return (
    <span className='tracks-item-img'>
      {isPaused ?
        <i aria-hidden="true" className='icon icon-pause'/>
        :
        <IconPlayAnim/>
      }
    </span>
  );

  return (
    <span className='tracks-item-img'>
      <i aria-hidden="true" className='icon icon-play move'/>
      <span className='number'>{index + 1}.</span>
    </span>
  );
};

export default PlaylistTrack
