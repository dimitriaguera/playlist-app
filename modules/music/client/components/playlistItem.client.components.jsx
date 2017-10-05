import React from 'react'
import { List, Button } from 'semantic-ui-react'

const PlaylistItem = (  props ) => {

    const { item, onPlay, onDelete, active, index, isPaused } = props;
    const iconName = isPaused ? 'pause' : 'play';

    return (
        <List.Item>
            <List.Content floated='right'>
                <Button icon='minus' onClick={onDelete} />
            </List.Content>
            {active && <List.Icon name={iconName} verticalAlign='middle' />}
            <List.Content onClick={onPlay}>
                {index + 1}. <List.Header as='a'>{item.name}</List.Header>
            </List.Content>
        </List.Item>
    );
};

export default PlaylistItem