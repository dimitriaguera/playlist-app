import {RNS_SHOW_NOTIFICATION, RNS_UPDATE_NOTIFICATION, RNS_HIDE_NOTIFICATION, RNS_REMOVE_ALL_NOTIFICATIONS} from './const';

const notificationsStore = (state = [], action = {}) => {
  switch(action.type) {
    case RNS_SHOW_NOTIFICATION:
      return [
        ...state,
        { ...action}
      ];

    case RNS_UPDATE_NOTIFICATION:
      for (let i = 0, l = state.length ; i < l ; i++){
        if (action.uid === state[i].uid){
          Object.assign(state[i], action);
        }
      }
      return [...state];


    case RNS_HIDE_NOTIFICATION:
      return state.filter(notification => {
        return notification.uid !== action.uid;
      });

    case RNS_REMOVE_ALL_NOTIFICATIONS:
      return [];

    default:
      return state
  }
};

export default notificationsStore
