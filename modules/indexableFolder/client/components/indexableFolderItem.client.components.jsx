import React from 'react'
import { Button, Icon } from 'semantic-ui-react'

import style from './style/indexableFolder.scss'

const IndexableFolderItem = ({ onClick, onGetFiles, onPlayAlbum, onListTracks, item, user, onAddItem, index }) => {

    const name = item.publicName || item.name;
    const inputName = `input-${index}`;

    let classes = ['fol-item'];
    if( !item.isFile ) classes.push('fol-item-isfolder');

    const ItemMenu = () => {
      if( !item.isFile ) {
          return (
              <span className='fol-item-menu'>
                <span className='fol-item-menu-inner'>
                    <Button onClick={onPlayAlbum} icon basic color="teal">
                        <Icon name='play' />
                    </Button>
                    <Button onClick={onListTracks} icon basic color="teal">
                        <Icon name='list' />
                    </Button>
                    <Button onClick={onGetFiles} disabled={!user} icon basic color="teal">
                        <Icon name='plus' />
                    </Button>
                </span>
            </span>
          );
      }

      else {
          return (
              <span className='fol-item-menu'>
                <span className='fol-item-menu-inner'>
                    <Button onClick={onAddItem} disabled={!user} icon basic color="teal">
                        <Icon name='plus' />
                    </Button>
                </span>
            </span>
          );
      }
    };

    return (
        <div className={classes.join(' ')}>
            <a onClick={onClick} href='#' className='fol-item-inner'>
                <Icon name={item.isFile?'music':'folder'} />
                <span className='fol-item-title'>
                    {name}
                </span>
            </a>
            <input id={inputName} name='sub-menu-radio' type='radio'/>
            <label htmlFor={inputName} className='fol-item-menu-label'><Icon color='teal' size='large' name='ellipsis vertical'></Icon></label>
            <ItemMenu/>
        </div>
    );
};

export default IndexableFolderItem