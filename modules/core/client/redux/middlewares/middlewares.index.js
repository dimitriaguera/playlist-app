/**
 * Created by Dimitri Aguera on 08/09/2017.
 */
import thunk from 'redux-thunk'
import logger from './logger'
import api from './api'

// Development middlewares.
const devTools = (process.env.NODE_ENV === 'production') ? [] : [logger];

// Export middlewares array for Redux.
const middlewares = [api, thunk, ...devTools];

export default middlewares
