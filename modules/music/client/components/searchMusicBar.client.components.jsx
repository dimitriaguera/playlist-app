import React, { Component } from 'react'
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

        console.log('SEARCH MOUNT');
        const _self = this;
        const { indexName, searchAction, startLimit = 3 } = this.props;

        const searchApi = (term) => {
            return searchAction(`${indexName}?q=${term}&fi=name`);
        };

        const obs = Rx.Observable.fromEvent(this.input, 'keyup')
            .pluck('target', 'value')
            .filter(text => text.length >= startLimit )
            .debounce(500 /* ms */)
            .distinctUntilChanged()
            .flatMapLatest(searchApi);

        obs.subscribe(
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
                <input ref={(element) => this.input=element } onChange={this.handleInputChange} type='text' name='inputText' placeholder='Search...' className='search-input'/>
            </div>
        );
    }
}


export default SearchMusicBar;

