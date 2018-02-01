/**
 * Created by Dimitri Aguera on 21/09/2017.
 */

import { ADMIN_ROLE } from 'users/commons/roles'
import * as MenuItem from 'users/client/components/menu/menu.client.components'

export const menuItems = [
  {
    isPrivate: true,
    roles: [ADMIN_ROLE],
    component: MenuItem.UsersItem
  },
  {
    isPrivate: true,
    component: MenuItem.AccountItem
  },
  {
    hiddenOnAuth: true,
    component: MenuItem.LoginItem
  }
];
