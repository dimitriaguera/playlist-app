import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'core/client/services/core.api.services'
import Rx from 'rx'

import style from './style/searchBar.scss'

class SearchFolderBar extends Component {

    componentDidMount() {

        const _self = this;

        const searchApi = (term) => {
            return _self.props.search(term);
        };

        const obs = Rx.Observable.fromEvent(this.element, 'keyup')
            .pluck('target', 'value')
            .filter(text => text.length > 1 )
            .debounce(500 /* ms */)
            .distinctUntilChanged()
            .flatMapLatest(searchApi)
            .pluck('msg', 'hits', 'hits');

        obs.subscribe(
            data => {
                const nodes = data.map((item) => item._source);
                _self.props.handlerResult(nodes);
            },

            error => {
                _self.setState({error: error});
            });

    }

    render(){

        return (
            <div style={this.props.style} className='search-bar'>
                <input ref={(element) => this.element=element } type='text' placeholder='Search...' className='search-input'/>
            </div>
        );
    }
}

const mapDispatchToProps = dispatch => {
    return {
        search: ( term ) => dispatch(
            get(`search/album?search=${term}`)
        ),
    }
};

const SearchFolderBarContainer = connect(
    null,
    mapDispatchToProps
)(SearchFolderBar);

export default SearchFolderBarContainer;

