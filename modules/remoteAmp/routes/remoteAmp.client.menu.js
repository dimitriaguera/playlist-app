/**
 * Created by Dimitri Aguera on 21/09/2017.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { Menu } from 'semantic-ui-react'
import { REMOTEAMP_ROLE } from 'users/commons/roles'

export const menuItems = [
    {
        isPrivate: true,
        roles: [REMOTEAMP_ROLE],
        component: () => <Menu.Item as={Link} to='/remoteAmp'>RemoteAmp</Menu.Item>,
    },
];