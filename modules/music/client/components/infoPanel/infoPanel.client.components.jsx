import React from 'react'
import ps from 'core/client/services/core.path.services'
import Img from 'music/client/components/image/image.client.components'

//import style from './style/infoPanel.scss'

const infoPanel = (props) => {

  const item = props.item;
  const meta = item.meta || item.tracks[0].meta || {};

  let cover = '';

  if( item.key ) cover = ps.changeSeparator(item.key, '___', '/');

  return (
    <div className='info-panel'>
      <div className='info-panel-img'>
        <Img title={`${meta.album || item.name} cover`}
             src={'pictures/' + cover + '/cover.jpg'}
             defaultSrc='static/images/default_cover.png'
        />
      </div>
      <div className='info-panel-album'>
        <h1>{item.title || item.name}</h1>
      </div>
      {(meta.albumartist || meta.artist) && <div className='info-panel-artist'>
        {meta.albumartist || meta.artist}
      </div>}
      {meta.year && <div className='info-panel-year'>
        {meta.year}
      </div>}
      {/*<div className='info-panel-disc'>*/}
        {/*{meta.albumartist || meta.artist}*/}
      {/*</div>*/}
    </div>
  )
};

export default infoPanel
