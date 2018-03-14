/**
 * Created by Dimitri Aguera on 26/09/2017.
 */
/**
 * This module give methods to register and call sockets events.
 * @type {{register, emit}}
 *
 */
module.exports = (function () {
  const socketsActions = {};

  return {

    register: (event, callback) => {
      // If event already registered, return.
      if (socketsActions[event]) {
        //@todo
        return console.log(`Event ${event} already registered for namespace A VENIR`);
      }

      // Else, register event.
      socketsActions[event] = {
        call: callback
      };
    },

    emit: (event, data) => {
      if (socketsActions[event]) {
        console.log('emit');
        try {
          socketsActions[event].call(data);
        }
        catch (err) {
          throw new Error(err);
        }
      }
    }
  }
}());
