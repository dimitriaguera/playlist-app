/**
 * Created by Dimitri on 22/10/2017.
 */
import React, { Component } from 'react'
import debounce from 'lodash/debounce'

function splitFetchHOC (params, fetchActions) {
  return function (WrappedComponent) {
    return class splitFetchWrapped extends Component {
      constructor (props) {
        super(props);
        this.state = {
          data: [],
          all: false,
          from: 0,
          size: params.size || 20,
          offset: params.offset || 0
        };

        // Where the lazy client have to listen scroll event
        // Must be an DomElmt with id
        this.scrollContainerName = 'main-content';

        // Bind functions passed in HOC factory function.
        // All passed functions are bind on onStartChunk HOC method as first argument.
        const wrapFetchActions = (actions) => {
          const wrapped = {};
          for (let prop in actions) {
            wrapped[prop] = this.onStartChunk.bind(this, actions[prop]);
          }
          return wrapped;
        };
        this.fetchActions = wrapFetchActions(fetchActions(props));

        // Handlers.
        this.onResizeHandle = this.onResizeHandle.bind(this);
        this.onScrollHandle = this.onScrollHandle.bind(this);
        this.onStartChunk = this.onStartChunk.bind(this);
        this.onGetChunk = this.onGetChunk.bind(this);

        // Debounced handlers.
        this.onResizeHandle = debounce(this.onResizeHandle, 150);
        this.onScrollHandle = debounce(this.onScrollHandle, 150);
      }

      componentDidMount () {
        // Event handlers.
        if (this.scrollContainerName === 'window'){
          this.scrollContainer = window;
        } else {
          this.scrollContainer = document.getElementById(this.scrollContainerName);
        }

        window.addEventListener('resize', this.onResizeHandle); // Just window have resize event
        this.scrollContainer.addEventListener('scroll', this.onScrollHandle);

        if (this.scrollContainerName === 'window'){
          // Set scroll up to window.
          if (window.scrollY) {
            window.scroll(0, 0);
          }
        } else {
          if (this.scrollContainer.scrollTop) {
            this.scrollContainer.scroll(0, 0);
          }
        }

      }

      componentWillUnmount () {
        // Close event handlers.
        window.removeEventListener('resize', this.onResizeHandle);
        this.scrollContainer.removeEventListener('scroll', this.onScrollHandle);
      }

      // Avoid child wrapped component rendering out of data update.
      shouldComponentUpdate (nextProps, nextState) {
        // @TODO check if nextProps shallow compare don't trigger render every time splitFetchWrapped render is called.
        return (nextState.data !== this.state.data || nextProps !== this.props);
      }

      onResizeHandle () {
        // Get component container size.
        if (this.container) {
          const height = (this.container) ? this.container.getBoundingClientRect().height : null;
          // Get window height.
          const screenY = window.innerHeight;
          // Store it.
          this.setState({height: height, screenY: screenY});
        }
      }

      onScrollHandle (e) {

        // If all result done, exit.
        if (this.state.all) return null;

        const {height, screenY, offset} = this.state;
        let scrollY;
        if (this.scrollContainerName === 'window'){
          scrollY = window.scrollY;
        } else {
          scrollY = this.scrollContainer.scrollTop;
        }


        // If window scrolled down, get next chunk result.
        if ((scrollY + screenY) >= height - offset) {
          this.onGetChunk(e);
        }
      }

      // Get first chunk from query.
      // Chunk size is stored in this.state.size
      onStartChunk (fetch, query) {
        const _self = this;
        const { size } = this.state;

        // Call binded function passed in HOC func factory.
        return fetch(`${query}&from=0&size=${size}`)
          .then((result) => {
            if (result.success) {
              // Get chunk result data.
              const all = (size >= result.msg.hits.total);
              const total = result.msg.hits.total;
              const docs = result.msg.hits.hits;
              const nodes = docs.map((item) => item._source);

              // Store it.
              _self.setState({
                from: size,
                data: nodes,
                all: all,
                total: total,
                query: query,
                fetch: fetch
              });

              // Call resize handler.
              _self.onResizeHandle();
            }
          });
      }

      // Get next chunk from query.
      onGetChunk () {
        const _self = this;
        const { data, from, size, fetch, query } = this.state;

        // Call binded function passed in HOC func factory,
        // with query params to get next chunk.
        return fetch(`${query}&from=${from}&size=${size}`)
          .then((result) => {
            if (result.success) {
              // Get chunk result data.
              const docs = result.msg.hits.hits;
              const nodes = docs.map((item) => item._source);
              const all = ((from + size) >= result.msg.hits.total);

              // Store it.
              _self.setState({
                all: all,
                from: (from + size),
                data: data.concat(nodes)
              });

              // Call resize handler.
              _self.onResizeHandle();
            }
          });
      }


      render () {
        // Construct props to pass to wrapped component.
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
