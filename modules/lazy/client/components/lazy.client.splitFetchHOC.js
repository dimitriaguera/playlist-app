/**
 * Created by Dimitri on 22/10/2017.
 */
import React, { Component } from 'react'
import debounce from 'lodash/debounce'

function splitFetchHOC(params, fetchActions) {

    return function(WrappedComponent) {

        return class splitFetchWrapped extends Component {

            constructor(props) {
                super(props);
                this.state = {
                    data: [],
                    all: false,
                    from: 0,
                    size: params.size || 20,
                    offset: params.offset || 0,
                };

                const wrapFetchActions = (actions) => {
                    const wrapped = {};
                    for(let prop in actions) {
                        wrapped[prop] = this.onStartChunk.bind(this, actions[prop]);
                    }
                    return wrapped;
                };

                this.fetchActions = wrapFetchActions(fetchActions(props));

                this.onResizeHandle = this.onResizeHandle.bind(this);
                this.onScrollHandle = this.onScrollHandle.bind(this);
                this.onStartChunk = this.onStartChunk.bind(this);
                this.onGetChunk = this.onGetChunk.bind(this);

                this.onResizeHandle = debounce(this.onResizeHandle, 150);
                this.onScrollHandle = debounce(this.onScrollHandle, 150);
            }

            componentDidMount() {
                window.addEventListener('resize', this.onResizeHandle);
                window.addEventListener('scroll', this.onScrollHandle);

                if (window.scrollY) {
                    window.scroll(0, 0);
                }
            }

            componentWillUnmount() {
                window.removeEventListener('resize', this.onResizeHandle);
                window.removeEventListener('scroll', this.onScrollHandle);
            }

            // Avoid child wrapped component rendering out of data update.
            shouldComponentUpdate(nextProps, nextState) {
                return (nextState.data !== this.state.data);
            }

            onResizeHandle() {
                const height = this.container.getBoundingClientRect().height;
                const screenY = window.innerHeight;
                this.setState({height:height, screenY:screenY});
            }

            onScrollHandle(e) {

                if(this.state.all) return null;

                const {height, screenY, offset} = this.state;
                const scrollY = window.scrollY;

                if( (scrollY + screenY) >= height - offset ) {
                    this.onGetChunk(e);
                }
            }

            onStartChunk(fetch, query) {

                const _self = this;
                const { size } = this.state;

                return fetch(`${query}&from=0&size=${size}`)
                    .then((result) => {
                        if(result.success){

                            const all = (size >= result.msg.hits.total);
                            const total = result.msg.hits.total;
                            const docs = result.msg.hits.hits;
                            const nodes = docs.map((item) => item._source);

                            _self.setState({
                                from: size,
                                data: nodes,
                                all: all,
                                total: total,
                                query: query,
                                fetch: fetch,
                            });
                            _self.onResizeHandle();
                        }
                    });
            }

            onGetChunk() {

                const _self = this;
                const { data, from, size, fetch, query } = this.state;

                return fetch(`${query}&from=${from}&size=${size}`)
                    .then((result) => {
                        if(result.success){

                            const docs = result.msg.hits.hits;
                            const nodes = docs.map((item) => item._source);

                            const all = ((from + size) >= result.msg.hits.total);

                            _self.setState({
                                all: all,
                                from:(from + size),
                                data: data.concat(nodes),
                            });
                            _self.onResizeHandle();
                        }
                    });
            }


            render() {

                const newProps = {
                    data: this.state.data,
                    total: this.state.total,
                    resizeHOC: this.onResizeHandle,
                    ...this.fetchActions
                };

                return (
                    <div ref={(ref) => this.container = ref}>
                        <WrappedComponent {...this.props} {...newProps} />
                    </div>
                )
            }
        }
    }
}

export default splitFetchHOC