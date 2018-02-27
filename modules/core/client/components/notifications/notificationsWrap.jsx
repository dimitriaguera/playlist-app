import React, {PropTypes} from 'react';
import {connect} from 'react-redux';

import Notifications from './notifications';

class NotificationsWrap extends React.Component {

  render() {
    const {notifications} = this.props;

    //Optional styling
    const style = {
      NotificationItem: { // Override the notification item
        DefaultStyle: { // Applied to every notification, regardless of the notification level
          margin: '10px 5px 2px 1px'
        },

        success: { // Applied only to the success notification item
          color: 'red'
        }
      }
    };

    return (
      <Notifications
        notifications={notifications}
        style={style}
      />
    );
  }
}

NotificationsWrap.contextTypes = {
  store: PropTypes.object
};

NotificationsWrap.propTypes = {
  notifications: PropTypes.array
};

const mapStateToProps = state => {
  return {
    notifications: state.notificationsStore
  }
};

const NotificationsWrapContainer = connect(
  mapStateToProps,
  null
)(NotificationsWrap);

export default NotificationsWrapContainer
