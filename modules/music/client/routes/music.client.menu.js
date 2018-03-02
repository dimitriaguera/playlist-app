/**
 * Created by Dimitri Aguera on 21/09/2017.
 */

import React from 'react'
import { Link } from 'react-router-dom'


export const menuItems = [
  {
    component: () => <li><Link to='/'>Playlists</Link></li>
  },
  {
    component: () => <li><Link to='/albums'>Albums</Link></li>
  },
  {
    component: () => <li><Link to='/tracks'>Tracks</Link></li>
  }
];
