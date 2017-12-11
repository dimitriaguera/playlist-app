import React, { Component } from 'react'
import Rx from 'rx'
import ps from 'folder/client/services/path.client.services'
import { forgeResquest } from 'core/client/services/core.api.services'
import { Icon } from 'semantic-ui-react'

import style from './style/searchBar.scss'

const KEY = {
    ESC: 27,
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
        this.handlerClearFilters = this.handlerClearFilters.bind(this);
        this.handlerRemoveFilter = this.handlerRemoveFilter.bind(this);

        this.radio = {};
        this.termsID = [];

        this.state = {
            inputText: '',
            inputFilter: '',
            suggestMode: true,
            suggestList: [],
            filters: [],
            filter: '',
            selected: {},
        };
    }

    componentDidMount() {

        const _self = this;
        const { searchAction, indexName, field = 'name', startLimit = 3 } = this.props;

        window.addEventListener('click', this.handlerClearFilters);
        window.addEventListener('keyup', this.handlerKeyup);

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

        this.subscribeOnSuggest();
        this.subscribeOnSearch();
    }

    componentWillUnmount() {
       window.removeEventListener('click', this.handlerClearFilters);
       window.removeEventListener('keyup', this.handlerKeyup);
    }

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

        // Arrow Up key.
        if (e.keyCode === KEY.UP) {
            return this.selectPrevElement(e);
        }

        // Arrow Down key.
        if (e.keyCode === KEY.DOWN) {
            return this.selectNextElement(e);
        }
    }

    selectPrevElement(e){
        const { selected = {}, suggestList } = this.state;

        if(suggestList.length < 1) return;

        let index = suggestList.indexOf(selected);

        index = index <= 0 ? suggestList.length - 1 : index - 1;

        this.setState({selected: suggestList[index]});
    }

    selectNextElement(e){
        const { selected = {}, suggestList } = this.state;

        if(suggestList.length < 1) return;

        let index = suggestList.indexOf(selected);

        index = suggestList.length > index + 1 ? index + 1 : 0;

        this.setState({selected: suggestList[index]});
    }

    // Handler that apply filter on click on suggestion.
    handlerAddFilter(e, item) {
        const { filters, inputText } = this.state;
        const { searchAction, indexName, field = 'name' } = this.props;

        const newFilters = filters.concat([item]);

        this.setState({
            filters: newFilters,
        });

        this.termsID.push(item._id);

        searchAction(`${indexName}?q=${inputText}&fi=${field}${buildFiltersRequest(newFilters)}`);
    }

    // Handler to remove a filter token.
    handlerRemoveFilter(e, item) {
        const { filters, inputText } = this.state;
        const { searchAction, indexName, field = 'name' } = this.props;

        const newFilters = filters.filter(function(i) {
            return i.value !== item.value;
        });

        this.setState({
            filters: newFilters,
        });

        this.termsID.splice(this.termsID.indexOf(item._id), 1);

        searchAction(`${indexName}?q=${inputText}&fi=${field}${buildFiltersRequest(newFilters)}`);
    }

    // Make Form input controlled.
    handlerInputChange(e) {

        const target = e.target;
        const value = target.value;
        const name = target.name;

        this.setState({
            inputFilter: '',
            suggestList: [],
            [name]: value
        });
    }

    // Make Form input controlled.
    handlerRadioChange(e) {

        const target = e.target;
        const value = target.value;
        const name = target.name;

        this.inputFilter.value = '';
        this.inputFilter.focus();

        this.setState({
            inputFilter: '',
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

        for(let elmt in this.radio){
            this.radio[elmt].checked = false;
        }

        this.setState({
            filter: '',
            inputFilter: '',
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
                           name="filter" value="date" disabled/>

                    <div className='sb-filter-panel'>

                        <ul className='sb-filter'>
                            {filters.map((item) =>
                                <li className='sb-filter-token' onClick={(e) => this.handlerRemoveFilter(e, item)} key={item._id}>
                                    <span>
                                        {item.text}<br/>
                                        <span>{item._type}</span>
                                    </span>
                                    <Icon name='remove'/>
                                </li>
                            )}
                        </ul>

                        <div className='sb-filter-input'>
                            <input ref={(element) => this.inputFilter=element }
                                   type='text'
                                   name='inputFilter'
                                   placeholder={filter + '...'}
                                   onChange={this.handlerInputChange}
                            />
                            {this.state.suggestList.length > 0 &&
                            <ul>
                            {this.state.suggestList.map((item) => {
                                if(this.termsID.indexOf(item._id) !== -1) return null;
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

