/**
 * Created by Dimitri Aguera on 12/09/2017.
 */
import { createStore, applyMiddleware, compose } from 'redux'
import storeApp from './reducers/reducers.index.js'
import middlewares from './middlewares/middlewares.index.js'

// @todo change this check on process.env on client side
const composeEnhancers = (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__)
  ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;

const store = createStore(storeApp, /* preloadedState, */ composeEnhancers(
  applyMiddleware(...middlewares)
));

export default store;
