/**
 * Created by Dimitri Aguera on 08/09/2017.
 */
import {
  oPLAY_TRACK, oPLAY_STATE, oPAUSE_STATE,
  oADD_PO_TO_QUEUE, oUPDATE_PO_IN_QUEUE
} from '../actions_po'

import pmService from '../../services/playingManager.client.services'

const initialState = {
  queue: [],
  indexQueue: 0,
  indexTrack: 0,
  pause: false,
};

export const playingManagerStore = (state = initialState, action) => {
  switch (action.type) {
    // case PLAY_ITEM:
    // case PAUSE_STATE:
    // case PLAY_STATE:
    //   return {
    //     ...state,
    //     pause: false
    //   };

    case oADD_PO_TO_QUEUE:
      return {
        queue: [
          ...state.queue,
          action.po
        ]
      };

    case oUPDATE_PO_IN_QUEUE:
      const nQueue = [].concat(state.queue);
      nQueue[pmService.testIndexQueue(state, action)] = action.po;
      return {
        queue: nQueue
      };

    case oPAUSE_STATE:
      return {
        ...state,
        pause: true
      };

    case oPLAY_STATE:
      return {
        ...state,
        pause: true
      };

    case oPLAY_TRACK:
      return {
        ...state,
        indexQueue: action.indexQueue || state.indexQueue || 0,
        indexTrack: action.indexTrack || state.indexTrack || 0,
        pause: false,
      };

    default:
      return state
  }
};
