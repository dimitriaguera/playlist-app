import React, { Component } from 'react'
import Rx from 'rx'
import ps from 'folder/client/services/path.client.services'
import { forgeResquest } from 'core/client/services/core.api.services'
import { Icon } from 'semantic-ui-react'

import style from './style/searchBar.scss'

const KEY = {
    ESC: 27,
    ENTER: 13,
    UP: 38,
    DOWN: 40,
};

class SearchMusicBar extends Component {

    constructor() {
        super();

        this.handlerInputChange = this.handlerInputChange.bind(this);
        this.handlerKeyup = this.handlerKeyup.bind(this);
        this.handlerRadioChange = this.handlerRadioChange.bind(this);
        this.handlerAddFilter = this.handlerAddFilter.bind(this);
        this.handlerAddDateFilter = this.handlerAddDateFilter.bind(this);
        this.handlerClearFilters = this.handlerClearFilters.bind(this);
        this.handlerRemoveFilter = this.handlerRemoveFilter.bind(this);

        this.radio = {};
        this.filtersID = [];

        this.state = {
            inputText: '',
            inputFilter: '',
            inputDateFrom: '',
            inputDateTo: '',
            suggestMode: true,
            suggestList: [],
            filters: [],
            filter: '',
            selected: {},
        };
    }

    // On mounting component:
    // - Apply and register window event listeners.
    // - Create input observers.
    // - Subscribe on input observers.
    componentDidMount() {

        const _self = this;
        const { searchAction, indexName, field = 'name', startLimit = 3 } = this.props;

        // Apply window events listeners.
        window.addEventListener('click', this.handlerClearFilters);
        window.addEventListener('keyup', this.handlerKeyup);

        // Suggest request func on elasticsearch endpoint.
        const apiSuggest = (term) => {
            const { filter } = _self.state;
            // Use forgeRequest method to avoid call API system that spread request state on redux store.
            // Need to be fast, with direct fetch call.
            return forgeResquest( 'GET', `suggest/${filter}?q=${term}`, null )();
        };

        // Search request func on elasticsearch endpoint.
        const apiSearch = (term) => {
            const { filters } = _self.state;
            const filterQuery = buildFiltersRequest(filters);
            // Use request given by properties.
            return searchAction(`${indexName}?q=${term}&fi=${field}${filterQuery}`);
        };

        // Create search input observer.
        this.observerSearch = Rx.Observable.fromEvent(this.input, 'keyup')
            .pluck('target', 'value')
            .filter(text => text.length >= startLimit )
            .debounce(500)
            .distinctUntilChanged()
            .flatMapLatest(apiSearch);

        // Create suggest input observer.
        this.observerSuggest = Rx.Observable.fromEvent(this.inputFilter, 'keyup')
            .pluck('target', 'value')
            .filter(text => text.length >= startLimit )
            .debounce(10)
            .distinctUntilChanged()
            .flatMapLatest(apiSuggest);

        // Make subscriptions.
        this.subscribeOnSuggest();
        this.subscribeOnSearch();
    }


    // Clear listeners.
    // @TODO need to clear observers ?
    componentWillUnmount() {
       window.removeEventListener('click', this.handlerClearFilters);
       window.removeEventListener('keyup', this.handlerKeyup);
    }


    // Subscribe on suggest observer.
    subscribeOnSuggest() {
        const _self = this;
        this.subscriberSuggest = this.observerSuggest.subscribe(
            data => {
                data.json().then(data => {
                    const list = data.msg.suggest.testSuggest[0].options;
                    const text = data.msg.suggest.testSuggest[0].text;
                    _self.setState({suggestList: list, inputFilter: text});
                });
            },
            error => {
                _self.setState({error: error});
            }
        );
    }


    // Subscribe on search observer.
    subscribeOnSearch() {
        const _self = this;
        this.subscriberSearch = this.observerSearch.subscribe(
            error => {
                _self.setState({error: error});
            }
        );
    }


    // Keyborad control.
    // Escape : clear filter panel.
    handlerKeyup(e) {

        // Escape key.
        if (e.keyCode === KEY.ESC) {
            return this.handlerClearFilters(e);
        }

        // Enter key.
        if (e.keyCode === KEY.ENTER) {
            // If suggest item selected, add it.
            if(this.state.selected._id && this.state.suggestList.length > 0) {
                return this.handlerAddFilter(e, this.state.selected);
            }
            // If date filter mode, add it.
            if(this.state.filter === 'date') {
                return this.handlerAddDateFilter(e);
            }
            return null;
        }

        // Arrow Up key.
        if (e.keyCode === KEY.UP) {
            return this.selectPrevElement(e);
        }

        // Arrow Down key.
        if (e.keyCode === KEY.DOWN) {
            return this.selectNextElement(e);
        }
    }


    // Select next suggestList element.
    selectPrevElement(e){

        const { selected = {}, suggestList } = this.state;
        const l = suggestList.length;

        // If suggestList empty, return.
        if(l < 1) return;

        // Initialise loop count.
        let count = 0;
        const filtersID = this.filtersID;

        // Define select loop func.
        function select(index) {
            let i = index <= 0 ? l - 1 : index - 1;
            if ( filtersID.indexOf(suggestList[i]._id) !== -1 ) {
                if( count < l ) {
                    count++;
                    return select(i);
                }
                return null;
            }
            return i;
        }

        // Get next selected filter id.
        let index = select(suggestList.indexOf(selected));

        // Store selected filter.
        if(index !== null){
            this.setState({selected: suggestList[index]});
        }
    }


    // Select previous suggest list element.
    selectNextElement(e){
        const { selected = {}, suggestList } = this.state;
        const l = suggestList.length;

        // If suggestList empty, return.
        if(l < 1) return;

        // Initialise loop count.
        let count = 0;
        const filtersID = this.filtersID;

        // Define select loop func.
        function select(index) {
            let i = l > index + 1 ? index + 1 : 0;
            if ( filtersID.indexOf(suggestList[i]._id) !== -1 ) {
                if( count < l ) {
                    count++;
                    return select(i);
                }
                return null;
            }
            return i;
        }

        // Get next selected filter id.
        let index = select(suggestList.indexOf(selected));

        // Store selected filter.
        if(index !== null) {
            this.setState({selected: suggestList[index]});
        }
    }


    // Handler that apply filter on click on suggestion.
    handlerAddFilter(e, item) {
        const { filters, inputText, selected } = this.state;
        const { searchAction, indexName, field = 'name' } = this.props;

        // Add filter item to filters list.
        const newFilters = filters.concat([item]);

        this.setState({
            filters: newFilters,
            selected: selected._id === item._id ? {} : selected,
        });

        // Register filter ID on filtersID list.
        this.filtersID.push(item._id);

        // Query data with new set of filters.
        searchAction(`${indexName}?q=${inputText}&fi=${field}${buildFiltersRequest(newFilters)}`);
    }


    // handler to add date range filter.
    handlerAddDateFilter(e) {
        const { inputDateFrom, inputDateTo } = this.state;

        // If no start date, exit.
        if( !inputDateFrom ) return null;

        let value, tag;

        // Build data filter item.
        if( !inputDateTo || inputDateFrom === inputDateTo ){
            value = `${inputDateFrom}to${inputDateFrom}`;
            tag = `${inputDateFrom}`;
        } else {
            value = `${inputDateFrom}to${inputDateTo}`;
            tag = `${inputDateFrom} - ${inputDateTo}`;
        }

        // If this date filter already exist, exit.
        if( this.filtersID.indexOf(value) !== -1 ) return null;

        // Query data with new set of filters.
        this.handlerAddFilter(e, { _id: value, _type: 'date', text: value, tag: tag});
    }


    // Handler to remove a filter token.
    handlerRemoveFilter(e, item) {
        const { filters, inputText } = this.state;
        const { searchAction, indexName, field = 'name' } = this.props;

        // Remove from filters list.
        const newFilters = filters.filter(function(i) {
            return i._id !== item._id;
        });

        this.setState({
            filters: newFilters,
        });

        // Remove from filtersID list.
        this.filtersID.splice(this.filtersID.indexOf(item._id), 1);

        // Query data with new set of filters.
        searchAction(`${indexName}?q=${inputText}&fi=${field}${buildFiltersRequest(newFilters)}`);
    }


    // Make Form input controlled.
    handlerInputChange(e) {

        const value = e.target.value;
        const name = e.target.name;

        this.setState({
            inputFilter: '',
            suggestList: [],
            [name]: value
        });
    }


    // Make Form input controlled.
    handlerRadioChange(e) {

        const value = e.target.value;
        const name = e.target.name;

        this.inputFilter.value = '';
        this.inputDateFrom.value = '';
        this.inputDateTo.value = '';

        if( value === 'date' ){
            this.inputDateFrom.focus();
        } else {
            this.inputFilter.focus();
        }

        this.setState({
            inputFilter: '',
            inputDateFrom: '',
            inputDateTo: '',
            suggestList: [],
            [name]: value
        });

        if(this.subscriberSuggest.isStopped) {
            this.subscribeOnSuggest();
        }
    }


    // Clear suggestion list, and filter input values.
    // Uncheck radio buttons.
    // Unsubscribe filter input observer.
    handlerClearFilters(e) {

        this.subscriberSuggest.dispose();
        this.inputFilter.value = '';
        this.inputDateFrom.value = '';
        this.inputDateTo.value = '';

        for(let elmt in this.radio){
            this.radio[elmt].checked = false;
        }

        this.setState({
            filter: '',
            inputFilter: '',
            inputDateFrom: '',
            inputDateTo: '',
            suggestList: [],
        });
    }


    render(){

        const { filters, filter, inputFilter, selected } = this.state;

        return (
            <div onClick={(e) => e.stopPropagation()} style={this.props.style} className='search-bar'>
                <div>
                    <input ref={(element) => this.radio.artist=element} type="radio" id="filter1" onChange={this.handlerRadioChange}
                           name="filter" value="artist" />

                    <input ref={(element) => this.radio.genre=element} type="radio" id="filter2" onChange={this.handlerRadioChange}
                           name="filter" value="genre"/>

                    <input ref={(element) => this.radio.date=element} type="radio" id="filter3" onChange={this.handlerRadioChange}
                           name="filter" value="date"/>

                    <div className='sb-filter-panel'>

                        <ul className='sb-filter'>
                            {filters.map((item) =>
                                <li className='sb-filter-token' onClick={(e) => this.handlerRemoveFilter(e, item)} key={item._id}>
                                    <span>
                                        {item.tag || item.text}<br/>
                                        <span>{item._type}</span>
                                    </span>
                                    <Icon name='remove'/>
                                </li>
                            )}
                        </ul>

                        <div className='sb-filter-input'>
                            <input ref={(element) => this.inputFilter=element }
                                   onChange={this.handlerInputChange}
                                   type='text'
                                   name='inputFilter'
                                   placeholder={filter + '...'}
                            />
                            <input ref={(element) => this.inputDateFrom=element }
                                   onChange={this.handlerInputChange}
                                   type='number'
                                   name='inputDateFrom'
                                   placeholder='(ex: 1998)'
                            />
                            <span className='input-date-prefix'>to</span>
                            <input ref={(element) => this.inputDateTo=element }
                                   onChange={this.handlerInputChange}
                                   type='number'
                                   name='inputDateTo'
                                   placeholder='(ex: 2002)'
                            />
                            <button onClick={this.handlerAddDateFilter}><b>Add</b></button>
                            {this.state.suggestList.length > 0 &&
                            <ul>
                            {this.state.suggestList.map((item) => {
                                if(this.filtersID.indexOf(item._id) !== -1) return null;
                                return (
                                    <li className={selected._id === item._id ? 'selected' : ''} key={item._id} onClick={(e) => this.handlerAddFilter(e, item)}>
                                        <b>{testOccurence(item.text, inputFilter)}</b>{removeFirstOccurence(item.text, inputFilter)}
                                    </li>
                                );
                            })}
                            </ul>}
                        </div>

                        <div className='sb-filter-menu'>
                            <span><Icon name='filter' /></span>
                            <label htmlFor="filter1">Artist</label>
                            <label htmlFor="filter2">Genre</label>
                            <label htmlFor="filter3">Date</label>
                        </div>

                        <input ref={(element) => this.input=element }
                               onChange={this.handlerInputChange}
                               onFocus={this.handlerClearFilters}
                               type='text'
                               name='inputText'
                               placeholder='search album...'
                               className='search-input'
                        />
                    </div>
                </div>
            </div>
        );
    }
}

function removeFirstOccurence( str, exp ) {
    const reg = new RegExp('^(' + exp + ')', 'i');
    return str.replace(reg, '');
}

function testOccurence( str, exp ) {
    const reg = new RegExp('^(' + exp + ')', 'i');
    if(reg.test(str)) {
        return exp;
    }
    return '';
}

function buildFiltersRequest(filters){

    const f = {};
    let query = '';

    for(let i = 0, l = filters.length; i < l; i++){
        if(f[filters[i]._type]){
            f[filters[i]._type] += '+' + filters[i].text;
            continue;
        }
        f[filters[i]._type] = filters[i].text;
    }

    for(let s in f){
        query += '&' + s + '=' + ps.urlEncode(f[s]);
    }

    return query;
}

export default SearchMusicBar;

