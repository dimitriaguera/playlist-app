/**
 * Created by Dimitri Aguera on 11/09/2017.
 */
import { requestAPI, successAPI, failureAPI } from '../actions/api.actions'
import { logoutUser } from 'users/client/redux/actions'

const CALL_API = Symbol('Call API');

/**
 * Pipe to proceed api call.
 * Request server.
 * Call states actions along the way.
 *
 * @param callAPI
 * @returns {function(*)}
 */
function proceedCallApi( callAPI ) {

    return dispatch => {

        // Build actions types called during pipe.
        // Default, set API actions.
        // If success, the pipe call actions on this order :
        // REQUEST_TYPE => HOOK_TYPE (optional) => SUCCESS_TYPE
        const { types = {} } = callAPI;
        const { HOOK_TYPE, REQUEST_TYPE = requestAPI, FAILURE_TYPE = failureAPI, SUCCESS_TYPE = successAPI } = types;

        // Call request action.
        dispatch(REQUEST_TYPE());

        // Start server request.
        return callAPI.send()

            // Server response testing.
            .then(rep => {
                checkStatus(rep, dispatch);
                if ( !rep.ok ) {
                    return Promise.reject(rep.statusText);
                }
                return rep.json();
            })

            // Data send by server testing.
            .then( data => {

                if ( !data.success ) {
                    return Promise.reject(data);
                }
                if ( HOOK_TYPE ) {
                    dispatch(HOOK_TYPE(data))
                }
                return data
            })

            // End pipe with success call.
            .then( data => {

                dispatch(SUCCESS_TYPE(data));
                return data;
            })

            // Catch any error during pipe process.
            .catch( err => {
                //const errMessage = err.message ? err.message : err.msg;
                dispatch(FAILURE_TYPE(err));
                return err;
            });
    }
}

/**
 * Middleware that hook API actions,
 * Then call API calling pipe.
 *
 * @param store
 */
const api = store => next => action => {

    // Get API symbol.
    const callAPI = action[CALL_API];

    // If no API symbol in action, exit API pipe.
    if ( typeof callAPI === 'undefined' ){
        return next(action);
    }

    // Start API pipe.
    return next( proceedCallApi( callAPI ) );
};

/**
 * Check response status.
 * Thanks Vladimir Metnew <vladimirmetnew@gmail.com>
 * @param res
 * @returns {*}
 */
function checkStatus ( rep, dispatch ) {

    const {status} = rep;

    if (status >= 200 && status < 300) {
        // Everything is ok
        return rep
    }
    else if (status >= 300 && status < 400) {
        // 300 Multiple Choices
        // 301 - Moved Permanently,
        // 302 - Found, Moved Temporarily
        // 304 - not modified
        // 307 - Temporary Redirect
        return rep
    }
    else if (status === 400) {
        // Probably is a validation error
        return rep
    }
    else if (status === 403 || status === 401) {
        // 401 - Forbidden
        // 403 - Unauthorized
        // Logout user from store in this case.
        return dispatch(logoutUser());
    }
    else if (status === 404) {
        // Not Found
        alert('404 !');
        return rep
    }
    else if (status >= 500) {
        // Server error
        return rep
    }
}

export { CALL_API }
export default api