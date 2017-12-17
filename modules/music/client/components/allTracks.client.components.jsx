import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'core/client/services/core.api.services'
import { playItem } from 'music/client/redux/actions'
import SearchMusicBar from './searchMusicBar.client.components'
import splitFetchHOC from 'lazy/client/components/lazy.client.splitFetchHOC'
import ps from 'core/client/services/core.path.services'
import { Divider, Icon } from 'semantic-ui-react'

import style from './style/allTracks.scss'

class AllTracks extends Component {

    constructor (props) {
        super(props);
        this.handlerPlayTracks = this.handlerPlayTracks.bind(this);
    }

    componentDidMount() {
        this.props.search(`tracks?fi="meta.title"&q=`);
    }

    // Handler to add recursively all tracks on playlist.
    handlerPlayTracks( e, item ) {
        // Build track item.
        const play = item;

        // Change global state to start playing track.
        this.props.readFile( play );
        e.preventDefault();
    }

    render(){

        //const { nodes } = this.state;

        return (
            <div>
                <h1>Tracks</h1>
                <SearchMusicBar indexName='tracks' field={'meta.title'} startLimit={0} searchAction={this.props.search} />
                <Divider/>

                {
                    this.props.data.map((item, i) => {
                        return (
                            <div className='alltracks-item-album' key={i}>
                                <div className='tracks-item-img' onClick={(e) => this.handlerPlayTracks(e, item)}>
                                    <img title="Album Cover" src={'pictures' + ps.removeLast(item.path) + 'cover.jpg'} width="50" height="50"></img>
                                    <Icon color='teal' circular inverted name='play'/>
                                </div>
                                <div className='tracks-item-info'>
                                    <div className='name'>{item.meta.title}</div>
                                    <span className='artist'><span>{item.meta.artist}</span></span>
                                    <span className='date'>{item.meta.date}</span>
                                </div>
                            </div>
                        );
                    })
                }
            </div>
        );
    }
}

const fetchActions = (props) => {
    return {
        search: props.search
    };
};

const AllTracksSplitFetchWrapped = splitFetchHOC(
    {size: 100, offset: 200},
    fetchActions
)(AllTracks);

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
        readFile: ( item ) => dispatch(
            playItem( item )
        ),
    }
};

const AllTracksContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(AllTracksSplitFetchWrapped);


export default AllTracksContainer