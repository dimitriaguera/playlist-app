import React from 'react'
import { Button, Icon } from 'semantic-ui-react'
import UploadZone from 'uploadZone/client/components/uploadZone.client.components'

const IndexableFolderItem = ({ onClick, onGetFiles, onPlayFolder, onListTracks, onEditMetaTag, item, user, onAddItem }) => {

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
                      <Button onClick={(e) => onPlayFolder(e, item)} icon basic color="teal">
                          <Icon name='play' />
                      </Button>
                      <Button onClick={(e) => onListTracks(e, item)} icon basic color="teal">
                          <Icon name='list' />
                      </Button>
                      <Button onClick={(e) => onGetFiles(e, item)} disabled={!user} icon basic color="teal">
                          <Icon name='plus' />
                      </Button>
                      <Button onClick={(e) => onEditMetaTag(e, item)} icon basic color="teal">
                          <Icon name='tags' />
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
                    <Button onClick={(e) => onEditMetaTag(e, item)} icon basic color="teal">
                        <Icon name='tags' />
                    </Button>
                </span>
            </span>
          );
      }
    };

    return (
        <UploadZone isFile={item.isFile} targetPath={item.path}>
          <div className={classes.join(' ')}>

              <a onClick={(e) => onClick(e, item)} href='#' className='fol-item-inner'>
                  <Icon name={iconName}/>
                  <span className='fol-item-title'>
                      {name}
                  </span>
              </a>
              <ItemMenu/>


          </div>
        </UploadZone>
    );
};

export default IndexableFolderItem