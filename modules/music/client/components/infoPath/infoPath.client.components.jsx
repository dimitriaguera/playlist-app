/**
 * Created by Dimitri on 26/10/2017.
 */
import React, { Component } from 'react'

class InfoPath extends Component {
  render () {
    const { meta } = this.props;
    const { artist, album, year, trackno, time, genre, disk } = meta;

    return (
      <span className='ip-container'>
        <span className='ip-item'>
          {artist} | {album} | {year} | track {trackno}
        </span>
      </span>
    );
  };
}

export default InfoPath
