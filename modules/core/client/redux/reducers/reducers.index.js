/**
 * Created by Dimitri Aguera on 08/09/2017.
 */
import { combineReducers } from 'redux'
import apiStore from './api.store'
import bootStore from './boot.store'

// MODULES STORES
import { authenticationStore } from 'users/client/redux/reducers/authentication.store'
import { playlistStore } from 'music/client/redux/reducers/playlist.store'

const storeApp = combineReducers({
    authenticationStore,
    playlistStore,
    bootStore,
    apiStore,
});

export default storeApp