/**
 * Created by Dimitri Aguera on 21/09/2017.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';

export const menuItems = [
  {
    component: () => (
      <NavLink to="/folder" activeClassName="nav-selected">
        Folder
      </NavLink>
    ),
    menuId: 'main'
  }
];
