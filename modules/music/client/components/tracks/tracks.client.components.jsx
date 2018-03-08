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
    const title = item.meta.title;

    let classes = ['pli-tracks'];
    if (active) classes.push('active');

    return (
      <a className={classes.join(' ')} onClick={onPlay(index)} href='#'>
        {active &&
          <div className='pli-inner-left'>
            {isPaused ?
              <i aria-hidden="true" className={`pli-play icon icon-pause`}/>
              :
              <IconPlayAnim/>
            }
          </div>
        }
        <span className='pli-inner'>
          <span className='pli-number'>{index + 1}.</span>
          <span className='pli-info'>
            <span className={'pli-title'}>{title || item.name}</span>
            <InfoPath meta={item.meta} />
          </span>
        </span>
        {(onDelete && canEdit) &&
        <span className='pli-menu'>
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
