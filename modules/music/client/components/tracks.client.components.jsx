import React, { Component } from 'react'
import { Icon, Button } from 'semantic-ui-react'
import InfoPath from 'music/client/components/infopath'

import style from './style/tracks.scss'

class Tracks extends Component {

    shouldComponentUpdate( nextProps ){

        const nextActive = nextProps.isActivePlaylist && ( nextProps.index === nextProps.onPlayIndex );
        const active = this.props.isActivePlaylist && ( this.props.index === this.props.onPlayIndex );

        return (
            this.props.item !== nextProps.item ||
            this.props.index !== nextProps.index ||
            active !== nextActive ||
            (active && this.props.isPaused !== nextProps.isPaused)
        )
    }

    render() {

        const {
            item, onPlay, onDelete, user, index, isPaused, onPlayIndex, isActivePlaylist
        } = this.props;

        const active = isActivePlaylist && ( index === onPlayIndex );
        const iconName = isPaused ? 'pause' : 'play';

        let classes = ['pli-tracks'];
        if ( active ) classes.push('active');

        return (
            <span className={classes.join(' ')}>
                {active && <div className='pli-inner-left'><Icon className='pli-play' inverted name={iconName} /></div>}
                <a className='pli-inner' onClick={onPlay(index)} href='#'>
                    <span className='pli-number'>{index + 1}.</span>
                    <span className='pli-info'>
                        <span className={'pli-title'}>{item.name}</span>
                        <InfoPath path={item.src}/>
                    </span>
                </a>
                {(onDelete && !!user) &&
                <span className='pli-menu'>
                    <Button onClick={onDelete(index)} icon basic size="mini" color="teal">
                    <Icon name='minus' />
                    </Button>
                </span>
                }
            </span>
        );
    }
}

export default Tracks