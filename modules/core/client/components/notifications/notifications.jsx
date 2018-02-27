import React from 'react';
import PropTypes from 'prop-types';

import * as actions from './notifications.actions';
import reducer from './notifications.store';

//import NotificationSystem from '../react-notification-system/dist/react-notification-system.js';
import NotificationSystem from 'react-notification-system';

import {RNS_SHOW_NOTIFICATION, RNS_UPDATE_NOTIFICATION, RNS_HIDE_NOTIFICATION, RNS_REMOVE_ALL_NOTIFICATIONS} from './const';


class Notifications extends React.Component {

  system() {
    return this.refs.notify;
  }

  componentWillReceiveProps(nextProps) {
    const {notifications} = nextProps;
    const notificationIds = notifications.map(notification => notification.uid);
    const systemNotifications = this.system().state.notifications || [];

    if (notifications.length > 0) {
      // Get all active notifications from react-notification-system
      // and remove all where uid is not found in the reducer
      (systemNotifications).forEach(notification => {
        if (notificationIds.indexOf(notification.uid) < 0) {
          this.system().removeNotification(notification.uid);
        }
      });

      notifications.forEach(notification => {

        let oldNotif = systemNotifications.filter((systemNotification) => systemNotification.uid === notification.uid);

        if (notification.type === RNS_SHOW_NOTIFICATION && oldNotif.length === 0) {
          this.system().addNotification({
            ...notification,
            onRemove: () => {
              this.context.store.dispatch(actions.hide(notification.uid));
              notification.onRemove && notification.onRemove();
            }
          });
        }
      });


      const notifToUpdate = notifications.filter( notif => notif.type === RNS_UPDATE_NOTIFICATION);

      if (notifToUpdate.length > 0) this.system().editNotifications(notifToUpdate)

    }

    if (this.props.notifications !== notifications && notifications.length === 0) {
      this.system().clearNotifications();
    }


  }

  shouldComponentUpdate(nextProps) {
    return this.props !== nextProps;
  }

  render() {
    const {notifications, ...rest} = this.props;

    return (
      <NotificationSystem ref='notify' { ...rest } />
    );
  }
}

Notifications.propTypes = {
  notifications: PropTypes.array
};

Notifications.contextTypes = {
  store: PropTypes.object
};

// Tie actions to Notifications component instance
Object.keys(actions).forEach(key => {
  Notifications[key] = actions[key];
});

Notifications.reducer = reducer;

module.exports = Notifications;
