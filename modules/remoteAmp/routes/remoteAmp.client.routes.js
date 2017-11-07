/**
 * Created by Dimitri Aguera on 21/09/2017.
 */
import remoteAmp from 'remoteAmp/client/components/remoteAmp.client.components.jsx';
import { ADMIN_ROLE, REMOTEAMP_ROLE } from 'users/commons/roles'

export const routes = [
    {
        private: true,
        route: {
            path: '/remoteAmp',
            exact: true,
            roles: [REMOTEAMP_ROLE],
            component: remoteAmp,
        },
    },
];
