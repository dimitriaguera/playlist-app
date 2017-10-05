/**
 * Created by Dimitri Aguera on 13/09/2017.
 */

export const API_REQUEST = 'API_REQUEST'
export const API_FAILURE = 'API_FAILURE'
export const API_SUCCESS = 'API_SUCCESS'

export function requestAPI () {
    return {
        type: API_REQUEST,
    }
}

export function failureAPI ( error ) {
    return {
        type: API_FAILURE,
        error
    }
}

export function successAPI () {
    return {
        type: API_SUCCESS,
    }
}
