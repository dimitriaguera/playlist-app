import React from 'react'
import { Button, Icon } from 'semantic-ui-react'

import style from './style/folderItem.scss'

const FolderItem = ({ onClick, onGetFiles, onPlayAlbum, onListTracks, item, user, onAddItem }) => {

    const name = item.publicName || item.name;

    const ItemMenu = () => {
      if( !item.isFile ) {
          return (
              <span className='fol-item-menu'>
                <span className='fol-item-menu-inner'>
                    <Button onClick={onPlayAlbum} icon basic size="mini" color="teal">
                        <Icon name='play' />
                    </Button>
                    <Button onClick={onListTracks} icon basic size="mini" color="teal">
                        <Icon name='list' />
                    </Button>
                    <Button onClick={onGetFiles} disabled={!user} icon basic size="mini" color="teal">
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
                    <Button onClick={onAddItem} disabled={!user} icon basic size="mini" color="teal">
                        <Icon name='plus' />
                    </Button>
                </span>
            </span>
          );
      }
    };

    return (
        <div className='fol-item'>
            <ItemMenu/>
            <a onClick={onClick} href='#' className='fol-item-inner'>
                <Icon name={item.isFile?'music':'folder'} size='large'/>
                <span className='fol-item-title'>
                    {name}
                </span>
            </a>
        </div>
    );
};

export default FolderItem