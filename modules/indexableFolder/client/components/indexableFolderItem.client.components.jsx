import React, { Component } from 'react'
import { Button, Icon } from 'semantic-ui-react'

import style from './style/indexableFolder.scss'

const IndexableFolderItem = ({ onClick, onGetFiles, onPlayAlbum, onListTracks, item, user, onAddItem, index }) => {

    const name = item.publicName || item.name;
    const stringPath = item.path;
    const inputName = `input-${index}`;

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
                    <Button onClick={(e) => onPlayAlbum(e, item, stringPath)} icon basic color="teal">
                        <Icon name='play' />
                    </Button>
                    <Button onClick={(e) => onListTracks(e, stringPath)} icon basic color="teal">
                        <Icon name='list' />
                    </Button>
                    <Button onClick={(e) => onGetFiles(e, stringPath)} disabled={!user} icon basic color="teal">
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
                    <Button onClick={(e) => onAddItem(e, item, stringPath)} disabled={!user} icon basic color="teal">
                        <Icon name='plus' />
                    </Button>
                </span>
            </span>
          );
      }
    };

    return (
        <div className={classes.join(' ')}>
            <a onClick={onClick(item, stringPath)} href='#' className='fol-item-inner'>
                <Icon name={iconName} />
                <span className='fol-item-title'>
                    {name}
                </span>
            </a>
            <input id={inputName} name='sub-menu-radio' type='radio'/>
            <label htmlFor={inputName} className='fol-item-menu-label'><Icon color='teal' size='large' name='ellipsis vertical'></Icon></label>
            <ItemMenu/>
        </div>
    );
};

// class IndexableFolderItem extends Component {
//
//     render() {
//
//         const { item } = this.props;
//         let classes = ['fol-item'];
//         let iconName = item.isFile?'music':'folder';
//
//         return (
//             <div className={classes.join(' ')}>
//                 <a href='#' className='fol-item-inner'>
//                     <Icon name={iconName} />
//                     <span className='fol-item-title'>
//                         {item.name}
//                     </span>
//                 </a>
//                 <input name='sub-menu-radio' type='radio'/>
//                 <label className='fol-item-menu-label'><Icon color='teal' size='large' name='ellipsis vertical'></Icon></label>
//             </div>
//         );
//     }
// }

export default IndexableFolderItem