import React from 'react'
import UploadZone from 'uploadZone/client/components/uploadZone.client.components'
import IconPlayAnim from 'music/client/components/iconPlayAnim/iconPlayAnim.client.components'

const IndexableFolderItem = (
  {
    item,
    onClick,
    onGetFiles,
    onAddItem,
    onPlayFolder,
    onListTracks,
    onEditMetaTag,
    onPlayTrackId,
    pause
  }) => {

  const name = item.publicName || item.name;


  if (item.isFile) {

    const ItemMenuFile = () => {
      return (
        <span className='fol-item-menu'>
            <button onClick={(e) => onAddItem(e, item)} className="btn btn-icon" title="Add track to the current playlist">
              <i aria-hidden="true" className='icon icon-l icon-plus'/>
            </button>
            <button onClick={(e) => onEditMetaTag(e, item)} className="btn btn-icon" title="Edit meta data">
              <i aria-hidden="true" className='icon icon-l icon-tag'/>
            </button>
        </span>
      );
    };

    let stateTrack = 'rien';
    if (onPlayTrackId === item._id) {
      stateTrack = 'play';
      if (pause) stateTrack = 'pause';
    }

    return (
      <li>
        <UploadZone isFile={item.isFile} targetPath={item.path}>
          <a href="#" className='fol-item' onClick={(e) => onClick(e, item)} title={`Play ${name}`}>
            {stateTrack === 'play' &&
            <span className='fol-item-ico-wrap'>
                <IconPlayAnim className='fol-item-icon' />
                <i aria-hidden='true' className='icon icon-l icon-pause fol-item-icon icon-pause-anim'/>
              </span>
            }
            {stateTrack === 'rien' &&
            <span className='fol-item-ico-wrap'>
                <i aria-hidden="true" className='icon icon-l icon-music fol-item-icon' aria-label='File'/>
                <i aria-hidden='true' className='icon icon-l icon-play fol-item-icon'/>
              </span>
            }
            {stateTrack === 'pause' &&
            <span className='fol-item-ico-wrap'>
                <i aria-hidden='true' className='icon icon-l icon-pause fol-item-icon'/>
              </span>
            }
            <span className='fol-item-title'>
            {name}
          </span>
            <ItemMenuFile/>
          </a>
        </UploadZone>
      </li>
    );

  } else {

    const ItemMenuFolder = () => {
      return (
        <span className='fol-item-menu'>
            <button onClick={(e) => onPlayFolder(e, item)} className="btn btn-icon" title="Play all tracks of this folder">
              <i aria-hidden="true" className='icon icon-l icon-play'/>
            </button>
            <button onClick={(e) => onListTracks(e, item)} className="btn btn-icon" title="Playlist view of all tracks of this folder">
              <i aria-hidden="true" className='icon icon-l icon-eye'/>
            </button>
            <button onClick={(e) => onGetFiles(e, item)} className="btn btn-icon" title="Add all track to the current playlist">
              <i aria-hidden="true" className='icon icon-l icon-plus'/>
            </button>
            <button onClick={(e) => onEditMetaTag(e, item)} className="btn btn-icon" title="Edit meta data of all tracks of this folder">
              <i aria-hidden="true" className='icon icon-l icon-tag'/>
            </button>
        </span>
      );
    };

    return (
      <li>
        <UploadZone isFile={item.isFile} targetPath={item.path}>
          <a href="#" className='fol-item fol-item-isfolder' onClick={(e) => onClick(e, item)} title={`Open ${name}`}>
            <span className='fol-item-ico-wrap'>
                <i aria-hidden="true" className={'icon icon-l icon-folder fol-item-icon'} aria-label='Folder'/>
            </span>
            <span className='fol-item-title'>
            {name}
            </span>
            <ItemMenuFolder/>
          </a>
        </UploadZone>
      </li>
    );


  }

};

export default IndexableFolderItem
