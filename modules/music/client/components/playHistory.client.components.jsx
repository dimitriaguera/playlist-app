import React, { Component } from 'react'
import { connect } from 'react-redux'
import { playItem } from 'music/client/redux/actions'
import { List, Divider, Header, Segment } from 'semantic-ui-react'

class PlayHistory extends Component {

    handlerReadFile( item ) {

        const { playingHistory, readFile } = this.props;

        return (e) => {

            this.props.readFile(item);
            e.preventDefault();
        }
    }

    render(){

        const { isPaused, playingHistory } = this.props;

        const itemsList = playingHistory.tracks.map( (item, i) => {
            return (
                <List.Item key={i} as='a' onClick={this.handlerReadFile(item)}>
                    <List.Content as='span'>{item.name}</List.Content>
                </List.Item>
            );
        });

        return (
            <Segment basic inverted>
                <Header as='h3'>Play History</Header>
                <Divider/>
                <List divided verticalAlign='middle' size='large' style={{height:'320px',overflowY:'auto'}}>
                    {itemsList}
                </List>
            </Segment>
        );
    }
}

const mapStateToProps = state => {
    return {
        playingHistory: state.playlistStore.playingHistory,
        isPaused: state.playlistStore.pause,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        readFile: ( item ) => dispatch(
            playItem( item, true )
        ),
    }
};

const PlayHistoryContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlayHistory);

export default PlayHistoryContainer