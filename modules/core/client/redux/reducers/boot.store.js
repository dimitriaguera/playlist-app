/**
 * Created by Dimitri Aguera on 13/09/2017.
 */
import { BOOT_REQUEST, BOOT_FAILURE, BOOT_SUCCESS } from '../actions/boot.actions';

let initialState = {
  isFetching: false,
  isBooted: false,
  bootError: false
};

const bootStore = (state = initialState, action) => {
  switch (action.type) {
    case BOOT_REQUEST:
      return Object.assign({}, state, {
        isFetching: true,
        isBooted: false,
        bootError: false
      });

    case BOOT_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        isBooted: true,
        bootError: false
      });

    case BOOT_FAILURE:
      return Object.assign({}, state, {
        isFetching: false,
        isBooted: true,
        bootError: true,
        error: action.error
      });

    default:
      return state;
  }
};

export default bootStore;
