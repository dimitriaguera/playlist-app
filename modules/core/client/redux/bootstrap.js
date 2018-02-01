/**
 * Created by Dimitri Aguera on 12/09/2017.
 */
import { get } from 'core/client/services/core.api.services'
import { requestBOOT, failureBOOT, proceedBOOT, successBOOT } from './actions/boot.actions'
import { getLocalToken } from 'users/client/services/users.storage.services'
import store from './store'

/**
 * Function that initialize App.
 * Call during Boot component is mounted.
 *
 */
export default function () {
  // Get token on sessionStorage.
  const token = getLocalToken();


  // Start boot.
  store.dispatch(initBoot(token))
}

/**
 * Initialize boot according to user's token.
 *
 * @param token
 * @returns {*}
 */
function initBoot (token) {
  // If token on sessionStorage,
  // Request user's info from server,
  // Then store them.
  if (token !== 'undefined' && !!token) {
    return dispatch => {
      dispatch(get('account', {
        types: {
          REQUEST_TYPE: requestBOOT,
          FAILURE_TYPE: failureBOOT,
          SUCCESS_TYPE: proceedBOOT(token)
        }
      }))
    }
  }

  // If no token, ending boot.
  return successBOOT();
}
