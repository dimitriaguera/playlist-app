import React from 'react'
import { Button, Icon } from 'semantic-ui-react'

import style from './style/folderItem.scss'

const FolderItem = ({ onClick, onGetFiles, onPlayAlbum, onListTracks, item, user, onAddItem, index }) => {

    const name = item.publicName || item.name;

    let classes = ['fol-item'];
    let iconName = 'music';

    if( !item.isFile ) {
      classes.push('fol-item-isfolder');
      iconName = 'folder';
    }

    const ItemMenu = () => {
      if( !item.isFile ) {
          return (
              <span className='fol-item-menu'>
                <span className='fol-item-menu-inner'>
                    <Button onClick={(e) => onPlayAlbum(e, item)} icon basic color="teal">
                        <Icon name='play' />
                    </Button>
                    <Button onClick={(e) => onListTracks(e, item)} icon basic color="teal">
                        <Icon name='list' />
                    </Button>
                    <Button onClick={(e) => onGetFiles(e, item)} disabled={!user} icon basic color="teal">
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
                    <Button onClick={(e) => onAddItem(e, item)} disabled={!user} icon basic color="teal">
                        <Icon name='plus' />
                    </Button>
                </span>
            </span>
          );
      }
    };

    return (
        <div className={classes.join(' ')}>
            <a onClick={(e) => onClick(e, item)} href='#' className='fol-item-inner'>
                <Icon name={iconName} />
                <span className='fol-item-title'>
                    {name}
                </span>
            </a>
            {/*@todo change input for button for perf and add it for mobile */}
            {/*<input id={inputName} name='sub-menu-radio' type='radio'/>*/}
            {/*<Icon color='teal' size='large' name='ellipsis vertical'></Icon>*/}
            <ItemMenu/>
        </div>
    );
};

export default FolderItem