import React, { Component } from 'react'
import { Icon } from 'semantic-ui-react'
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
            item, onPlay, onDelete, index, isPaused, onPlayIndex, isActivePlaylist, user
        } = this.props;

        const active = isActivePlaylist && ( index === onPlayIndex );
        const iconName = isPaused ? 'pause' : 'play';

        let classes = ['playlistItem'];
        if ( active ) classes.push('active');

        return (
            <a className={classes.join(' ')} onClick={onPlay(index)} href='#'>
                {active && <div className='pli-inner-left'><Icon className='pli-play' inverted name={iconName} /></div>}
                <span className='pli-inner'>
                    <span className='pli-number'>{index + 1}.</span>
                        {item.name}
                    {/*{!!user &&*/}
                        {/*<span className='pli-menu'>*/}
                            {/*<Icon className='pli-delete' name='minus' onClick={onDelete(index)}/>*/}
                        {/*</span>*/}
                    {/*}*/}
                </span>
            </a>
        );
    }
}

export default PlaylistItem