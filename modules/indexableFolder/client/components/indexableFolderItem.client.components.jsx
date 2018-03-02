import React from 'react'
import { button, Icon } from 'semantic-ui-react'
import UploadZone from 'uploadZone/client/components/uploadZone.client.components'

import style from './style/folderItem.scss'

const IndexableFolderItem = ({ onClick, onGetFiles, onPlayFolder, onListTracks, onEditMetaTag, item, user, onAddItem }) => {
  const name = item.publicName || item.name;

  let classes = ['fol-item'];
  let iconName = 'icon-music';

  if (!item.isFile) {
    classes.push('fol-item-isfolder');
    iconName = 'icon-folder';
  }

  const ItemMenu = () => {
    if (!item.isFile) {
      return (
        <span className='fol-item-menu'>
          <span className='fol-item-menu-inner'>
            <button onClick={(e) => onPlayFolder(e, item)} className="btn btn-icon">
              <span aria-hidden="true" className='icon icon-m icon-play' />
            </button>
            <button onClick={(e) => onListTracks(e, item)} className="btn btn-icon">
              <span aria-hidden="true" className='icon icon-m icon-list' />
            </button>
            <button onClick={(e) => onGetFiles(e, item)} className="btn btn-icon">
              <span aria-hidden="true" className='icon icon-m icon-plus' />
            </button>
            <button onClick={(e) => onEditMetaTag(e, item)} className="btn btn-icon">
              <span aria-hidden="true" className='icon icon-m icon-tag' />
            </button>
          </span>
        </span>
      );
    }

    else {
      return (
        <span className='fol-item-menu'>
          <span className='fol-item-menu-inner'>
            <button onClick={(e) => onAddItem(e, item)} className="btn btn-icon">
              <span aria-hidden="true" className='icon icon-m icon-plus' />
            </button>
            <button onClick={(e) => onEditMetaTag(e, item)} className="btn btn-icon">
              <span aria-hidden="true" className='icon icon-m icon-tag' />
            </button>
          </span>
        </span>
      );
    }
  };

  return (
    <li className={classes && classes.join(' ')}>
     <UploadZone isFile={item.isFile} targetPath={item.path}>


        <a onClick={(e) => onClick(e, item)} href='#' className='fol-item-inner'>
          <span aria-hidden="true" className={`icon icon-l ${iconName}`} />
          <span className='fol-item-title'>
            {name}
          </span>
        </a>
        <ItemMenu />

      </UploadZone>
    </li>
  );
};

export default IndexableFolderItem
