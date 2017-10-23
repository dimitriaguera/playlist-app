import React, { Component } from 'react'
import { Item, Icon, Button } from 'semantic-ui-react'

class PlaylistItem extends Component {

    shouldComponentUpdate( nextProps ){

        return (
            this.props.item !== nextProps.item ||
            this.props.active !== nextProps.active ||
            (this.props.active && this.props.isPaused !== nextProps.isPaused)
        )
    }

    render() {

        const {item, onPlay, onDelete, active, index, isPaused} = this.props;
        const iconName = isPaused ? 'pause' : 'play';

        return (
            <Item>
                <Item.Content>
                <Item.Extra floated='right'>
                    <Button icon='minus' onClick={onDelete}/>
                </Item.Extra>
                {active && <Icon name={iconName} verticalAlign='middle'/>}
                <Item.Header onClick={onPlay}>
                    {index + 1}. <Item.Header as='a'>{item.name}</Item.Header>
                </Item.Header>
                </Item.Content>
            </Item>
        );
    }
}

export default PlaylistItem