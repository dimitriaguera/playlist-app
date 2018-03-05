/**
 * Created by Dimitri Aguera on 21/09/2017.
 */

import React from 'react'
import { NavLink } from 'react-router-dom'

export const menuItems = [
  {
    component: () => <li><NavLink to='/music' activeClassName="nav-selected">Folder</NavLink></li>
  }
];
