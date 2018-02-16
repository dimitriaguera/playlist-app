/**
 * Created by Dimitri Aguera on 08/09/2017.
 */
import store from 'core/client/redux/store'
import _ from 'lodash'
import { ALL_ROLE } from '../../commons/roles'

/**
 * Return true if store is authenticated state,
 * False if no.
 *
 * @returns {boolean}
 */
export function isAuthenticated () {
  const Auth = store.getState().authenticationStore;
  return !!Auth.isAuthenticated;
}

/**
 * Helper for authorizations.,
 * according roles and user authentification.
 *
 * @param item
 * @param user
 * @param roles
 * @returns {*}
 */
export function allowDisplayItem (user, roles) {
  if (!user)
  { return false; }

  if (!roles)
  { return true; }

  return hasRole(user, roles);
}


/**
 * Return true if user if user exist, and if user's role match.
 *
 * @param user
 * @param roles
 * @returns {boolean}
 */
export function hasRole (user, roles) {
  const ids = [];
  for (let i = 0; i < roles.length; i++) ids.push(roles[i].id);
  return (!!user && !!_.intersection(user.roles, ids).length);
}

export function getRoleNames (rolesIds) {
  let roles = '';
  for (let i = 0; i < rolesIds.length; i++) {
    for (let j = 0; j < ALL_ROLE.length; j++) {
      if (rolesIds[i] === ALL_ROLE[j].id) roles = `${roles} ${i !== 0 ? '/' : ' '} ${ALL_ROLE[j].name}`
    }
  }
  return roles;
}
