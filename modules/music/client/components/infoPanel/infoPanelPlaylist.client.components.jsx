import React from 'react'
import ps from 'core/client/services/core.path.services'
import Img from 'music/client/components/image/image.client.components'
import { getFormatedDate } from 'core/client/services/core.date.services'

import defaultCover from 'assets/images/default_pl_1.jpg'

const infoPanelPlaylist = (props) => {

  const item = props.item;

  return (
    <div className='info-panel-playlist'>

      <div className='info-panel-playlist-img'>
        <Img title={item.title}
             src={'/blabla'}
             defaultSrc={defaultCover}
        />
      </div>

      <div className='info-panel-playlist-meta'>
        <h1 className='title'>{item.title}</h1>

        <span className='author-wrapper'>
          {item.author &&
          <span className='author'>
            Created by {item.author.username}
          </span>
          }
          {item.created &&
          <span className='created'>
            &nbsp;on {getFormatedDate(item.created)}
          </span>
          }
        </span>
        {item.tracks &&
        <span className='length'>
          {item.tracks.length} tracks
        </span>
        }
      </div>
    </div>
  )
};

export default infoPanelPlaylist
