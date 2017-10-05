/**
 * Created by Dimitri Aguera on 21/09/2017.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { Menu } from 'semantic-ui-react'

export const menuItems = [
    {
        component: () => <Menu.Item as={Link} to='/'>Home</Menu.Item>,
    },
];