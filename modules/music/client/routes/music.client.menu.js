/**
 * Created by Dimitri Aguera on 21/09/2017.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { Menu } from 'semantic-ui-react'

export const menuItems = [
    {
        component: () => <Menu.Item as={Link} to='/'>Playlists</Menu.Item>,
    },
    {
        component: () => <Menu.Item as={Link} to='/albums'>Albums</Menu.Item>,
    },
    {
        component: () => <Menu.Item as={Link} to='/tracks'>Tracks</Menu.Item>,
    },
];