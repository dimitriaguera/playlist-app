import React, { Component } from 'react'
import { List, Button } from 'semantic-ui-react'

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
            <List.Item>
                <List.Content floated='right'>
                    <Button icon='minus' onClick={onDelete}/>
                </List.Content>
                {active && <List.Icon name={iconName} verticalAlign='middle'/>}
                <List.Content onClick={onPlay}>
                    {index + 1}. <List.Header as='a'>{item.name}</List.Header>
                </List.Content>
            </List.Item>
        );
    }
}

export default PlaylistItem