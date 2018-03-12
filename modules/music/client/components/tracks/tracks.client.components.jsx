import React, { Component } from 'react'
import ps from 'core/client/services/core.path.services'
import IconPlayAnim from 'music/client/components/iconPlayAnim/iconPlayAnim.client.components'
import { getAlbumKeyFromTrackNodeMeta, normalizedMeta } from 'indexableFolder/server/services/indexableFolder.key.services'

class Tracks extends Component {
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
    e.preventDefault();
    e.stopPropagation();
    const key = ps.urlEncode(getAlbumKeyFromTrackNodeMeta(ps, normalizedMeta(this.props.item)));
    this.props.history.push(`/album/${key}`);
  }

  render () {
    const {
      item, user, onPlay, onDelete, addTrack, canEdit, index, isPaused, onPlayIndex, isActivePlaylist, forAlbum, forPlaylist
    } = this.props;

    const active = isActivePlaylist && (index === onPlayIndex);

    let classes = ['move-tracks-items-row'];
    if (active) classes.push('active');
    if (forAlbum) classes.push('for-album');

    const artist = item.meta.artist ? item.meta.artist : item.meta.albumartist;

    console.log("render tracks");

    return (
      <div aria-label='play track' className={classes.join(' ')} onClick={onPlay(index)} draggable='false'>
          {active ?
            <span className='tracks-item-img'>
              {isPaused ?
                <i aria-hidden="true" className={`icon icon-pause`}/>
                :
                <IconPlayAnim/>
              }
            </span>
            :
            <span className='tracks-item-img'>
              <i aria-hidden="true" className={`icon icon-play move`}/>
              <span className='number'>{index + 1}.</span>
            </span>
          }

        <span className='title'>{item.meta.title}</span>
        {artist && <span className='artist'>{artist}</span>}
        {(!forAlbum && item.meta.album) && <a href={'#'} onClick={this.toAlbumPage} className='album'>{item.meta.album}</a>}
        {item.meta.time && <span className='time'>{item.meta.time}</span>}

        <span className='tracks-item-menu'>
          {user && addTrack && <button className='btn' onClick={e => addTrack(e, item.tracksId)}>
            <i aria-hidden="true" className="icon icon-plus" />
          </button>}
          {(canEdit && onDelete) && <button className='btn' onClick={onDelete(index)}>
            <i aria-hidden="true" className="icon icon-x" />
          </button>}
        </span>
      </div>
    );
  }
}

export default Tracks
