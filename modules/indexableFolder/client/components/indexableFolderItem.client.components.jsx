import React from 'react'
import UploadZone from 'uploadZone/client/components/uploadZone.client.components'

const IndexableFolderItem = ({ onClick, onGetFiles, onPlayFolder, onListTracks, onEditMetaTag, item, user, onAddItem }) => {
  const name = item.publicName || item.name;

  let classes = ['fol-item'];
  let iconName = 'icon-music';
  let type = 'file';

  if (!item.isFile) {
    classes.push('fol-item-isfolder');
    iconName = 'icon-folder';
    type = 'folder';
  }

  const ItemMenu = () => {
    if (!item.isFile) {
      return (
        <span className='fol-item-menu'>
            <button onClick={(e) => onPlayFolder(e, item)} className="btn btn-icon">
              <i aria-hidden="true" className='icon icon-l icon-play' />
            </button>
            <button onClick={(e) => onListTracks(e, item)} className="btn btn-icon">
              <i aria-hidden="true" className='icon icon-l icon-list' />
            </button>
            <button onClick={(e) => onGetFiles(e, item)} className="btn btn-icon">
              <i aria-hidden="true" className='icon icon-l icon-plus' />
            </button>
            <button onClick={(e) => onEditMetaTag(e, item)} className="btn btn-icon">
              <i aria-hidden="true" className='icon icon-l icon-tag' />
            </button>
        </span>
      );
    }

    else {
      return (
        <span className='fol-item-menu'>
            <button onClick={(e) => onAddItem(e, item)} className="btn btn-icon">
              <i aria-hidden="true" className='icon icon-l icon-plus' />
            </button>
            <button onClick={(e) => onEditMetaTag(e, item)} className="btn btn-icon">
              <i aria-hidden="true" className='icon icon-l icon-tag' />
            </button>
        </span>
      );
    }
  };

  return (
    <li>
     <UploadZone isFile={item.isFile} targetPath={item.path} className={classes && classes.join(' ')}>
        <i aria-hidden="true" className={`icon icon-l ${iconName} fol-item-icon`} aria-label={type}/>
        <a href="#" onClick={(e) => onClick(e, item)} className='fol-item-title'>
            {name}
        </a>
        <ItemMenu />
      </UploadZone>
    </li>
  );
};

export default IndexableFolderItem
