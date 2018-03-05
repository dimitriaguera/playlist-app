/**
 * Created by Dimitri Aguera on 21/09/2017.
 */

import React from 'react'
import { NavLink } from 'react-router-dom'

export const menuItems = [
  {
    component: () => <li className='main-nav-li'><NavLink to='/' exact activeClassName="nav-selected">Playlists</NavLink></li>
  },
  {
    component: () => <li className='main-nav-li'><NavLink to='/albums' activeClassName="nav-selected">Albums</NavLink></li>
  },
  {
    component: () => <li className='main-nav-li'><NavLink to='/tracks' activeClassName="nav-selected">Tracks</NavLink></li>
  }
];


