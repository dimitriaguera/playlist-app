/**
 * Created by Dimitri Aguera on 11/09/2017.
 */
/**
 * Log les changements dans le store.
 * Pour e développement
 *
 */
const logger = store => next => action => {

        console.log('dispatching', action);
        let result = next(action);
        console.log('next state', store.getState());
        return result

};

export default logger