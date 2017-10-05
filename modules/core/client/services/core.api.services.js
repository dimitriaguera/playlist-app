/**
 * Created by Dimitri Aguera on 12/09/2017.
 */
import config from 'env/config'
import { CALL_API } from 'core/client/redux/middlewares/api'
import { failureAPI } from 'core/client/redux/actions/api.actions'
import { getLocalToken } from 'users/client/services/users.storage.services'

const BASE_URL = config.api_base_url;

/**
 * Check, build, and return a function
 * to execute a controlled fetch request.
 *
 * @param method
 * @param endpoint
 * @param data
 * @returns {function()}
 */
function forgeResquest( method, endpoint, data = {} ) {

    // Build request url.
    let url = BASE_URL + endpoint;

    // Return function that execute controlled fetch.
    return () => {

        // Build defaults fetch request params.
        const params = {
            method,
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
        };

        // If GET, remove body data.
        if ( method === 'GET' ) {
            try {
                // const urlParams = data || {};
                // url = new URL(url);
                // Object.keys(urlParams).forEach(key => url.searchParams.append(key, urlParams[key]))
                data = null;
            }
            catch (e) {
                console.log(`Unable to put params on GET ${url} api request : ${e.message}`);
            }
        }
        else if ( data === Object(data) ) {
            params.body = JSON.stringify(data);
        }
        else {
            throw new Error(`Invalid XHR request. See ${method} at ${url}`);
        }

        // Get token from localStorage or sessionStorage
        // And put it in headers.
        const token = getLocalToken();
        if (token) {
            params.headers.authorization = token;
        }

        // Build fetch.
        return fetch(url, params);
    }
}

/**
 *
 * Those functions encapsule requests with CALL_API symbol.
 * This symbol trigger API middleware when action is dispatched.
 * Then, the middleware pass request through api pipe.
 *
 */

/**
 * Request API with GET method.
 *
 * @param endpoint
 * @param options
 * @returns {{}}
 */
export const get = ( endpoint, options = {} ) => {
    const { data, types } = options;
    return {
        [CALL_API]: {
            send: forgeResquest( 'GET', endpoint, data ),
            types: types,
        }
    }
};

/**
 * Request API with POST method.
 *
 * @param endpoint
 * @param options
 * @returns {{}}
 */
export const post = ( endpoint, options = {} ) => {
    const { data, types } = options;
    return {
        [CALL_API]: {
            send: forgeResquest( 'POST', endpoint, data ),
            types: types,
        }
    }
};

/**
 * Request API with PUT method.
 *
 * @param endpoint
 * @param options
 * @returns {{}}
 */
export const put = ( endpoint, options = {} ) => {
    const { data, types } = options;
    return {
        [CALL_API]: {
            send: forgeResquest( 'PUT', endpoint, data ),
            types: types,
        }
    }
};

/**
 * Request API with DELETE method.
 *
 * @param endpoint
 * @param options
 * @returns {{}}
 */
export const del = ( endpoint, options = {} ) => {
    const { data, types } = options;
    return {
        [CALL_API]: {
            send: forgeResquest( 'DELETE', endpoint, data ),
            types: types,
        }
    }
};