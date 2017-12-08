import React, { Component } from 'react'
import Rx from 'rx'
import ps from 'folder/client/services/path.client.services'
import { forgeResquest } from 'core/client/services/core.api.services'

import style from './style/searchBar.scss'

class SearchMusicBar extends Component {

    constructor() {
        super();
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handlerAddFilter = this.handlerAddFilter.bind(this);
        this.handleClearInput = this.handleClearInput.bind(this);
        this.handlerRemoveFilter = this.handlerRemoveFilter.bind(this);

        this.state = {
            inputText: '',
            suggestMode: true,
            suggestList: [],
            filters: [],
            filter: 'artist',
        };
    }

    // componentDidMount() {
    //
    //     const _self = this;
    //     const { indexName, searchAction, field = 'name', startLimit = 3 } = this.props;
    //
    //     const searchApi = (term) => {
    //         return searchAction(`${indexName}?q=${term}&fi=${field}`);
    //     };
    //
    //     const obs = Rx.Observable.fromEvent(this.input, 'keyup')
    //         .pluck('target', 'value')
    //         .filter(text => text.length >= startLimit )
    //         .debounce(500 /* ms */)
    //         .distinctUntilChanged()
    //         .flatMapLatest(searchApi);
    //
    //     obs.subscribe(
    //         error => {
    //             _self.setState({error: error});
    //         });
    //
    // }

    componentDidMount() {

        const _self = this;
        const { searchAction, indexName, field = 'name', startLimit = 3 } = this.props;

        this.radioArtist.checked = true;

        const apiSuggest = (term) => {
            const { filter } = _self.state;
            return forgeResquest( 'GET', `suggest/${filter}?q=${term}`, null )();
        };

        const apiSearch = (term) => {
            const { filters } = _self.state;
            const filterQuery = buildFiltersRequest(filters);
            return searchAction(`${indexName}?q=${term}&fi=${field}${filterQuery}`);
        };

        this.observerSearch = Rx.Observable.fromEvent(this.input, 'keyup')
            .pluck('target', 'value')
            .filter(text => text.length >= startLimit )
            .debounce(500 /* ms */)
            .distinctUntilChanged()
            .flatMapLatest(apiSearch);

        this.observerSuggest = Rx.Observable.fromEvent(this.inputFilter, 'keyup')
            .pluck('target', 'value')
            .filter(text => text.length >= startLimit )
            .debounce(10 /* ms */)
            .distinctUntilChanged()
            .flatMapLatest(apiSuggest);

        this.subscriberSuggest = this.observerSuggest.subscribe(
            data => {
                data.json().then(data => {
                    const list = data.msg.suggest.testSuggest[0].options;
                    _self.setState({suggestList: list});
                });
            },
            error => {
                _self.setState({error: error});
            }
        );

        this.subscriberSearch = this.observerSearch.subscribe(
            error => {
                _self.setState({error: error});
            }
        );
    }

    // Handler that apply filter on click on suggestion.
    handlerAddFilter(e, item) {
        const { filters, inputText } = this.state;
        const { searchAction, indexName, field = 'name' } = this.props;

        const newFilters = filters.concat([{
            type: item._type,
            value: item.text,
        }]);

        this.setState({
            //suggestList: [],
            filters: newFilters,
        });

        searchAction(`${indexName}?q=${inputText}&fi=${field}${buildFiltersRequest(newFilters)}`);
        e.preventDefault();
    }

    // Handler to remove a filter token.
    handlerRemoveFilter(e, item) {
        const { filters, inputText } = this.state;
        const { searchAction, indexName, field = 'name' } = this.props;

        const newFilters = filters.filter(function(i) {
            return i.value !== item.value;
        });

        this.setState({
            //suggestList: [],
            filters: newFilters,
        });

        searchAction(`${indexName}?q=${inputText}&fi=${field}${buildFiltersRequest(newFilters)}`);
        e.preventDefault();
    }

    // Handler for blur event.
    handleClearInput(e) {

        const target = e.target;
        const name = target.name;
        if(target.type === 'checkbox'){
            target.checked = false;
        }
        else {
            target.value = '';
        }

        this.setState({
            [name]: '',
        });
    }

    // Make Form input controlled.
    handleInputChange(e) {

        const target = e.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        if(target.name === 'filter'){
            this.inputFilter.value = '';
            this.setState({
                inputFilter: '',
                suggestList: [],
                [name]: value,
            });
            this.inputFilter.focus();
        }
        else {
            this.setState({
                [name]: value
            });
        }
    }

    render(){
        const { filters, filter } = this.state;
        return (
            <div style={this.props.style} className='search-bar'>
                <div>
                    <input ref={(element) => this.radioArtist=element} type="radio" id="filter1" onChange={this.handleInputChange}
                           name="filter" value="artist" />

                    <input type="radio" id="filter2" onChange={this.handleInputChange}
                           name="filter" value="genre"/>

                    <input type="radio" id="filter3" onChange={this.handleInputChange}
                           name="filter" value="date"/>

                    <div className='sb-filter-panel'>
                        <ul className='sb-filter'>
                            {
                                filters.map((item, i) => <li className='sb-filter-token' onClick={(e) => this.handlerRemoveFilter(e, item)} key={i}>{item.value}<br/><span>{item.type}</span></li> )
                            }
                        </ul>
                        <input ref={(element) => this.inputFilter=element } onChange={this.handleInputChange} type='text' name='inputFilter' placeholder={filter + '...'} className='search-input'/>
                        <div className='sb-filter-menu'>
                            <label htmlFor="filter1">Art</label>
                            <label htmlFor="filter2">Gen</label>
                            <label htmlFor="filter3">Dat</label>
                        </div>
                        <input ref={(element) => this.input=element } onChange={this.handleInputChange} type='text' name='inputText' placeholder='Album...' className='search-input'/>
                    </div>

                    <div>{this.state.suggestList.map((item) => {
                        return (
                            <div key={item._id}>
                                <a onClick={(e) => this.handlerAddFilter(e, item)}>{item.text} - <span>{item._type}</span></a>
                            </div>
                        );
                    })}</div>
                </div>
            </div>
        );
    }
}

function buildFiltersRequest(filters){

    const f = {};
    let query = '';

    for(let i = 0, l = filters.length; i < l; i++){
        if(f[filters[i].type]){
            f[filters[i].type] += '+' + filters[i].value;
            continue;
        }
        f[filters[i].type] = filters[i].value;
    }

    for(let s in f){
        query += '&' + s + '=' + ps.urlEncode(f[s]);
    }

    return query;
}

export default SearchMusicBar;

