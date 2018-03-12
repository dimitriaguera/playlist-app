import React, { Component } from 'react'
import InfoPath from 'music/client/components/infoPath/infoPath.client.components'
import IconPlayAnim from 'music/client/components/iconPlayAnim/iconPlayAnim.client.components'

class Tracks extends Component {
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

  render () {
    const {
      item, onPlay, onDelete, canEdit, index, isPaused, onPlayIndex, isActivePlaylist
    } = this.props;

    const active = isActivePlaylist && (index === onPlayIndex);
    const iconName = isPaused ? 'pause' : 'play';

    let classes = ['tracks-items-row'];
    if (active) classes.push('active');

    const artist = item.meta.artist ? item.meta.artist : item.meta.albumartist;

    return (
      <a className={classes.join(' ')} onClick={onPlay(index)} href='#'>
        {/*{active &&*/}
          {/*<div className='pli-inner-left'>*/}
            {/*{isPaused ?*/}
              {/*<i aria-hidden="true" className={`pli-play icon icon-pause`}/>*/}
              {/*:*/}
              {/*<IconPlayAnim/>*/}
            {/*}*/}
          {/*</div>*/}
        {/*}*/}
        <span className='tracks-item-img'>
          <span className='pli-number'>{index + 1}.</span>
        </span>

        <span className='title'>{item.meta.title}</span>
        {artist && <span className='artist'>{artist}</span>}
        {item.meta.album && <span className='album'>{item.meta.album}</span>}

        {(onDelete && canEdit) &&
        <span className='tracks-item-menu'>
          <button className='btn' onClick={onDelete(index)}>
            <i aria-hidden="true" className="icon icon-trash-2" />
          </button>
        </span>
        }
      </a>
    );
  }
}

export default Tracks
