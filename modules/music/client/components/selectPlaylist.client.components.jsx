import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'core/client/services/core.api.services'
import { activatePlaylist } from 'music/client/redux/actions'
import { Select } from 'semantic-ui-react'

class SelectPlaylist extends Component {

    constructor( props ) {
        super(  props );
        this.handleChange = this.handleChange.bind(this);
        this.state = {
            allPlaylist: [],
        }
    }

    componentWillMount() {
        const _self = this;
        this.props.getAllPlaylistName()
            .then( (data) => {
                if( data.success ){
                    const {activePlaylist, defaultValue} = _self.props;
                    _self.setState({ allPlaylist: data.msg });

                    if ( defaultValue ) {
                        let pl = getValue(defaultValue, _self.state.allPlaylist);
                        pl = pl ? pl : _self.state.allPlaylist[0];
                        _self.props.activatePlaylist(pl);
                    }
                    else if ( !activePlaylist ) {
                        _self.props.activatePlaylist(_self.state.allPlaylist[0]);
                    }
                }
            });
    }

    handleChange(e, data) {

        const value = data.value;
        const allPl = this.state.allPlaylist;
        const pl = getValue(value, allPl);

        this.props.activatePlaylist(pl);
    }

    render(){

        const { allPlaylist } = this.state;
        const { activePlaylist } = this.props;

        const defaultValue = activePlaylist ? activePlaylist.title : null;

        const playlistOptions = allPlaylist.map( (pl) => {
            return {
                key: pl.title,
                value: pl.title,
                text: pl.title,
            }
        });

        return (
            <Select placeholder='Select your playlist' onChange={this.handleChange} value={defaultValue} options={playlistOptions} />
        );
    }
}

const mapStateToProps = state => {
    return {
        activePlaylist: state.playlistStore.activePlaylist,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        activatePlaylist: ( item ) => dispatch(
            activatePlaylist( item )
        ),
        getAllPlaylistName: () => dispatch(
            get( 'allPlaylist' )
        ),
    }
};

const SelectPlaylistContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(SelectPlaylist);


// HELPER
function getValue( value, array ) {
    for ( let i=0; i < array.length; i++ ) {
        if ( array[i].title === value ) {
            return array[i];
        }
    }
    return null;
}


export default SelectPlaylistContainer