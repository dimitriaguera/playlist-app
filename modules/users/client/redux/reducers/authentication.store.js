/**
 * Created by Dimitri Aguera on 08/09/2017.
 */
import {
    REGISTER_REQUEST, REGISTER_SUCCESS, REGISTER_FAILURE,
    LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE,
    LOGOUT_REQUEST, LOGOUT_SUCCESS
} from '../actions'

let initialState = {
    isFetching: false,
    isAuthenticated: false,
    error: {},
    _user: null,
};

export const authenticationStore = (state = initialState, action) => {
    switch (action.type) {

        case LOGIN_REQUEST:
            return Object.assign({}, state, {
                isFetching: true,
                isAuthenticated: false,
            });

        case LOGIN_SUCCESS:
            return Object.assign({}, state, {
                isFetching: false,
                isAuthenticated: true,
                error: {},
                _user: action.user,
            });

        case LOGIN_FAILURE:
            return Object.assign({}, state, {
                isFetching: false,
                isAuthenticated: false,
                _user: null,
                error: action.msg,
            });

        case REGISTER_REQUEST:
            return Object.assign({}, state, {
                isFetching: true,
            });

        case REGISTER_SUCCESS:
            return Object.assign({}, state, {
                isFetching: false,
                isAuthenticated: false,
                error: {},
            });

        case REGISTER_FAILURE:
            return Object.assign({}, state, {
                isFetching: false,
                isAuthenticated: false,
                _user: null,
                error: action.msg,
            });

        case LOGOUT_REQUEST:
            return Object.assign({}, state, {
                isFetching: true,
            });

        case LOGOUT_SUCCESS:
            return Object.assign({}, state, {
                isFetching: false,
                isAuthenticated: false,
                _user: null,
                error: {},
            });

        default:
            return state
    }
};