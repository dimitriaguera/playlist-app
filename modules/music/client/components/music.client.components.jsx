import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'core/client/services/core.api.services'
import { playOnPlaylist } from 'music/client/redux/actions'
import SearchMusicBar from './searchMusicBar.client.components'


class Music extends Component {

    constructor( props ) {

        super(props);

        this.state = {
            nodes: [],
        }
    }

    componentWillMount() {

    }

    // Unmount and delete socket.
    componentWillUnmount() {

    }


    render(){

        const { nodes } = this.state;

        return (
            <div>
                <h1>Music</h1>
                <SearchMusicBar indexName='album'  handlerResult={result => this.setState({nodes: result})} />

                {
                    nodes.map((item, i) => {
                        return (
                            <div key={i}>
                                {item.name}
                            </div>
                        );
                    })
                }
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        user: state.authenticationStore._user,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        readFile: ( item ) => dispatch(
            playOnPlaylist( item )
        ),
    }
};

const MusicContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Music);

export default MusicContainer