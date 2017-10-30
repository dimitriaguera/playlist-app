/**
 * Created by Dimitri on 26/10/2017.
 */
import React, { Component } from 'react'
import { Icon } from 'semantic-ui-react'
import pathService from 'folder/client/services/path.client.services'

import style from './style/infopath.scss'

class InfoPath extends Component {

    render() {

        const { path, icon = 'angle right', delta = 0 } = this.props;
        const items = pathService.splitPath(path);

        items.pop();

        const bread = items.map( ( item, i ) => {

            const l = items.length;
            const count = delta === 0 ? l : l - 1;
            const width = `${(100 - delta) / count}%`;

            return (
                <span key={i} className='ip-item' style={{maxWidth: width}}>
                    {(!!i) && <Icon name={icon}/>}
                    {item}
                </span>
            )
        });

        return (
            <span className='ip-container' style={{textAlign:'left'}}>
                {bread}
            </span>
        );
    };
}

export default InfoPath