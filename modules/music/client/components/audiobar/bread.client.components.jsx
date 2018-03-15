import React, { Component } from 'react'
import ps from 'core/client/services/core.path.services'
import config from 'env/config.client'
import { Link } from 'react-router-dom'



class Bread extends Component {
  shouldComponentUpdate (nextProps) {
    const { onPlay, isOpen } = nextProps;
    return (onPlay !== this.props.onPlay || isOpen !== this.props.isOpen);
  }

  splitStr (str) {
    let path = '';

    return ps.splitPath(str).map((shard, i, array) => {
      // If last part of path, no path needed.
      if (i === array.length - 1) return {content: shard};

      // Build path.
      path = i ? `${path}/${shard}` : shard;

      // Return object useful for bread build.
      return {
        content: shard,
        path: path
      }
    });
  }

  render () {
    const { onPlay, isOpen } = this.props;
    const items = this.splitStr(onPlay.path);

    let classes = ['meta-track-bread'];
    if (isOpen) {
      classes.push('is-open');
    }

    const bread = items.map((item, i) => {

      if (item.path) {
        return (
          <div key={i} className='meta-track-bread-link'>
            <Link to={`/music/${item.path}`}>{item.content}</Link>
            <i aria-hidden="true" className='icon icon-chevron-right'/>
          </div>
        );
      }

      const name = item.content.replace(config.fileSystem.fileAudioTypes, '');

      return (
        <div key={i} className='meta-track-bread-play'>
          {name}
        </div>
      );

      // if (item.path) {
      //   return (
      //     <Popup
      //       key={i}
      //       trigger={
      //         <span className='meta-track-bread-link'>
      //           <Link to={`/music/${item.path}`} style={{maxWidth: width}}>{item.content}</Link>
      //           <i aria-hidden="true" className='icon icon-chevron-right'/>
      //         </span>}
      //       content={item.content}
      //       inverted
      //     />
      //   );
      // }
      //
      // const name = item.content.replace(config.fileSystem.fileAudioTypes, '');
      //
      // return (
      //   <Popup
      //     key={i}
      //     trigger={<span style={{maxWidth: '65%'}} className='meta-track-bread-play'>{name}</span>}
      //     content={name}
      //     inverted
      //   />
      // );
    });

    return (
      <div className={classes.join(' ')}>
        {bread}
      </div>
    );
  };
}

export default Bread
