/**
 * Created by Dimitri Aguera on 13/09/2017.
 */
import { API_REQUEST, API_FAILURE, API_SUCCESS } from '../actions/api.actions';

let initialState = {
  isFetching: false
};

const apiStore = (state = initialState, action) => {
  switch (action.type) {
    case API_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });

    case API_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false
      });

    case API_FAILURE:
      return Object.assign({}, state, {
        isFetching: false,
        error: action.error
      });

    default:
      return state;
  }
};

export default apiStore;
