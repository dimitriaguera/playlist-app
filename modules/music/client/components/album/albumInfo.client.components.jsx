import React from 'react'
import Img from 'music/client/components/image/image.client.components'
import defaultCover from 'assets/images/default_cover.png'

const AlbumInfo = ({album, handlerPlayAlbum, handlerAddTracks}) => {

  const artist = album.albumartist || album.artist;

  return (
    <div className='album-info'>
      <div className='album-info-meta'>
        {album.name && <span className='name'>{album.name}</span>}
        <span className='genre'>
          {album.genre.map(g => <span>{g}</span>)}
        </span>
        {artist && <span className='artist'>{artist}</span>}
        {album.year && <span className='year'>{album.year}</span>}
        {album.label && <span className='label'>{album.label}</span>}
        {(!album.diskno || album.diskno !== 0 ) && <span className='diskno'>{`disk ${album.diskno} / ${album.diskof}`}</span>}
      </div>
      <div className='album-info-menu'>
        <button onClick={handlerPlayAlbum} className='btn icon-btn big'><i aria-hidden='true' className='icon icon-play'/></button>
        <button onClick={handlerAddTracks} className='btn icon-btn big'><i aria-hidden='true' className='icon icon-plus'/></button>
      </div>
    </div>
  )
};

export default AlbumInfo
