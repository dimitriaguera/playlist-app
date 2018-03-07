/**
 * Created by Dimitri Aguera on 21/09/2017.
 */

import React from 'react'
import { NavLink } from 'react-router-dom'

export const menuItems = [
  {
    component: () => <NavLink to='/' exact activeClassName="nav-selected">Playlists</NavLink>,
    menuId: 'main'
  },
  {
    component: () => <NavLink to='/albums' activeClassName="nav-selected">Albums</NavLink>,
    menuId: 'main'
  },
  {
    component: () => <NavLink to='/tracks' activeClassName="nav-selected">Tracks</NavLink>,
    menuId: 'main'
  }
];


