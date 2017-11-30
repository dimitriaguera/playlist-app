import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'core/client/services/core.api.services'
import Rx from 'rx'

import style from './style/searchBar.scss'

class SearchMusicBar extends Component {

    constructor() {
        super();
        this.handleInputChange = this.handleInputChange.bind(this);
        this.state = {
            inputText: '',
        };
    }

    componentDidMount() {

        const _self = this;
        const { indexName, startLimit = 3 } = this.props;

        const searchApi = (term) => {
            return _self.props.search(`${indexName}?q=${term}&fi=name`);
        };

        const obs = Rx.Observable.fromEvent(this.inputText, 'keyup')
            .pluck('target', 'value')
            .filter(text => text.length >= startLimit )
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

    // Make Form input controlled.
    handleInputChange(e) {

        const target = e.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    render(){

        return (
            <div style={this.props.style} className='search-bar'>
                <input ref={(element) => this.inputText=element } onChange={this.handleInputChange} type='text' name='inputText' placeholder='Search...' className='search-input'/>
            </div>
        );
    }
}

const mapDispatchToProps = dispatch => {
    return {
        search: ( query ) => dispatch(
            get(`search/${query}`)
        ),
    }
};

const SearchMusicBarContainer = connect(
    null,
    mapDispatchToProps
)(SearchMusicBar);

export default SearchMusicBarContainer;

