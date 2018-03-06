import React from 'react'
import IconPlayAnim from 'music/client/components/iconPlayAnim/iconPlayAnim.client.components'
import { playState, pauseState } from 'music/client/redux/actions'
import {connect} from "react-redux";

const AlbumInfo = ({album, handlerPlayAlbum, handlerAddTracks, albumIsPlaying, play, pause, isPaused}) => {

  const artist = album.albumartist || album.artist;

  const getButton = () => {
    if( albumIsPlaying ) {
      if(isPaused){
        return (
        <button aria-label='resume play album' onClick={play} className='btn btn-icon big'>
          <i aria-hidden='true' className='icon icon-pause'/>
        </button>
        )}
      else {
        return (
        <button aria-label='pause album' onClick={pause} className='btn btn-icon big'>
          <IconPlayAnim onClick={pause}/>
        </button>
        )}
    }
    else {
      return (
        <button aria-label='play album' onClick={handlerPlayAlbum} className='btn btn-icon big'>
          <i aria-hidden='true' className='icon icon-play'/>
        </button>
      )}
    };

  return (
    <div className='album-info'>
      <div className='album-info-meta'>
        {album.name && <span className='name'>{album.name}</span>}
        <span className='genre'>
          {album.genre.map( (g, i) => <span key={i}>{g}</span>)}
        </span>
        {artist && <span className='artist'>{artist}</span>}
        {album.year && <span className='year'>{album.year}</span>}
        {album.label && <span className='label'>{album.label}</span>}
        {(album.diskno && album.diskno !== '0') && <span className='diskno'>{`disk ${album.diskno} / ${album.diskof}`}</span>}
      </div>
      <div className='album-info-menu'>
        {getButton()}
        <button aria-label='add album tracks to playlist' onClick={handlerAddTracks} className='btn btn-icon big'><i aria-hidden='true' className='icon icon-plus'/></button>
      </div>
    </div>
  )
};

const mapStateToProps = state => {
  return {
    isPaused: state.playlistStore.pause
  }
};

const mapDispatchToProps = dispatch => {
  return {
    play: () => dispatch(playState()),
    pause: () => dispatch(pauseState())
  }
};

const AlbumInfoContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AlbumInfo);

export default AlbumInfoContainer
