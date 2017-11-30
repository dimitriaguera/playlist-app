import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'core/client/services/core.api.services'
import { playOnPlaylist } from 'music/client/redux/actions'
import SearchMusicBar from './searchMusicBar.client.components'
import Tracks from './tracks.client.components'
import { Divider, Label, Button, Segment } from 'semantic-ui-react'


class Albums extends Component {

    constructor( props ) {

        super(props);

        this.state = {
            nodes: [],
        }
    }

    componentDidMount() {
        const _self = this;
        this.props.search(`album?q=`)
            .then((data) => {
                if(data.success){
                    const docs = data.msg.hits.hits;
                    const nodes = docs.map((item) => item._source);
                    _self.setState({nodes:nodes});
                }
            })
    }

    // Unmount and delete socket.
    componentWillUnmount() {

    }


    render(){

        const { nodes } = this.state;

        return (
            <div>
                <h1>Albums</h1>
                <SearchMusicBar indexName='album'  startLimit={0} handlerResult={result => this.setState({nodes: result})} />

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
        search: ( query ) => dispatch(
            get(`search/${query}`)
        ),
    }
};

const AlbumsContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Albums);

export default AlbumsContainer