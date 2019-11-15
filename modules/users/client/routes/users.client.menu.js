/**
 * Created by Dimitri Aguera on 21/09/2017.
 */

import { ADMIN_ROLE } from 'users/commons/roles';
import * as MenuItem from 'users/client/components/menu/menu.client.components';

export const menuItems = [
  {
    isPrivate: true,
    roles: [ADMIN_ROLE],
    component: MenuItem.UsersItem,
    menuId: 'main'
  },
  {
    hiddenOnAuth: true,
    component: MenuItem.LoginItem,
    menuId: 'user'
  },
  {
    isPrivate: true,
    component: MenuItem.MyAccountItem,
    menuId: 'user'
  },
  {
    isPrivate: true,
    component: MenuItem.LogoutItem,
    menuId: 'user'
  }
];
