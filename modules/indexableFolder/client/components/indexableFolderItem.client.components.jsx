import React, { Component } from 'react'
import { Button, Icon } from 'semantic-ui-react'
import DropZone from './dropZone.client.components'

const IndexableFolderItem = ({ onClick, onGetFiles, onPlayAlbum, onListTracks, item, user, onAddItem }) => {

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
                      <Button onClick={(e) => onPlayAlbum(e, item)} icon basic color="teal">
                          <Icon name='play' />
                      </Button>
                      <Button onClick={(e) => onListTracks(e, item)} icon basic color="teal">
                          <Icon name='list' />
                      </Button>
                      <Button onClick={(e) => onGetFiles(e, item)} disabled={!user} icon basic color="teal">
                          <Icon name='plus' />
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
                </span>
            </span>
          );
      }
    };

    return (
        <DropZone>
          <div className={classes.join(' ')}>

              <a onClick={(e) => onClick(e, item)} href='#' className='fol-item-inner'>
                  <Icon name={iconName}/>
                  <span className='fol-item-title'>
                      {name}
                  </span>
              </a>
              <ItemMenu/>

          </div>
        </DropZone>
    );
};

// class IndexableFolderItem extends Component {
//
//     render() {
//
//         const { item } = this.props;
//         const iconName = item.isFile?'music':'folder';
//
//         return (
//             <div className='ifol-item'>
//                 <a href='#' className='ifol-item-inner'>
//                     <Icon name={iconName} />
//                     <span className='ifol-item-title'>
//                         {item.name}
//                     </span>
//                 </a>
//             </div>
//         );
//     }
// }

export default IndexableFolderItem