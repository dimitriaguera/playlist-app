/**
 * Created by Dimitri Aguera on 15/09/2017.
 */
const ADMIN_ROLE = {id: 'ADMIN_ROLE', name: 'admin'};
const USER_ROLE = {id: 'USER_ROLE', name: 'user'};
const INVIT_ROLE = {id: 'INVIT_ROLE', name: 'invit'};
const REMOTEAMP_ROLE = {id: 'REMOTEAMP_ROLE', name: 'remoteAmp'};

const DEFAULT_AUTH_ROLE = USER_ROLE;

module.exports = {
    ADMIN_ROLE: ADMIN_ROLE,
    USER_ROLE: USER_ROLE,
    INVIT_ROLE: INVIT_ROLE,
    REMOTEAMP_ROLE: REMOTEAMP_ROLE,
    DEFAULT_AUTH_ROLE: DEFAULT_AUTH_ROLE,
    ALL_ROLE: [ADMIN_ROLE, USER_ROLE, INVIT_ROLE, REMOTEAMP_ROLE],
};