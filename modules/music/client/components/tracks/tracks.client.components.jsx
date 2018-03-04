import React, { Component } from 'react'
import { Button } from 'semantic-ui-react'
import InfoPath from 'music/client/components/infoPath/infoPath.client.components'

import style from './style/tracks.scss'

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
      <span className={classes.join(' ')}>
        {active && <div className='pli-inner-left'><i aria-hidden="true" className={`pli-play icon icon-${iconName}`} /></div>}
        <a className='pli-inner' onClick={onPlay(index)} href='#'>
          <span className='pli-number'>{index + 1}.</span>
          <span className='pli-info'>
            <span className={'pli-title'}>{title || item.name}</span>
            <InfoPath meta={item.meta} />
          </span>
        </a>
        {(onDelete && canEdit) &&
        <span className='pli-menu'>
          <Button onClick={onDelete(index)} icon basic size='mini' color='teal'>
            <i aria-hidden="true" className="icon icon-minus" />
          </Button>
        </span>
        }
      </span>
    );
  }
}

export default Tracks
