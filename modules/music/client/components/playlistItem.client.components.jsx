import React, { Component } from 'react'
import { Icon, Button } from 'semantic-ui-react'
import style from './style/playlistItem.scss'

class PlaylistItem extends Component {

    shouldComponentUpdate( nextProps ){

        const nextActive = nextProps.isActivePlaylist && ( nextProps.index === nextProps.onPlayIndex );
        const active = this.props.isActivePlaylist && ( this.props.index === this.props.onPlayIndex );

        return (
            this.props.item !== nextProps.item ||
            active !== nextActive ||
            (active && this.props.isPaused !== nextProps.isPaused)
        )
    }

    render() {

        const {
            item, onPlay, onDelete, index, isPaused,
            onTouchStart, onMouseDown, onPlayIndex, isActivePlaylist
        } = this.props;

        const active = isActivePlaylist && ( index === onPlayIndex );
        const iconName = isPaused ? 'pause' : 'play';

        let classes = ['playlistItem'];
        if ( active ) classes.push('active');

        return (
            <div className={classes.join(' ')}>
                {active && <div className='pli-inner-left'><Icon className='pli-play' color='teal' name={iconName} /></div>}
                <div className='pli-inner'>
                    <span className='pli-number'>{index + 1}.</span>
                    <a href='#' onClick={onPlay(index)}>
                        {item.name}
                    </a>
                    <span className='pli-menu'>
                        <Icon className='pli-delete' name='minus' onClick={onDelete(index)}/>
                    </span>
                </div>
                <div className='pli-inner-right' onTouchStart={onTouchStart} onMouseDown={onMouseDown}>
                    <Icon className='pli-move' name='move' color='grey' />
                </div>
            </div>
        );
    }
}

export default PlaylistItem