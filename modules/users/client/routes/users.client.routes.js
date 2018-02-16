/**
 * Created by Dimitri Aguera on 21/09/2017.
 */
import { ADMIN_ROLE, USER_ROLE, INVITE_ROLE } from 'users/commons/roles'

import User from 'users/client/components/administration/user.client.components'
import EditUser from 'users/client/components/administration/edit.user.client.components'
import Account from 'users/client/components/administration/account.client.components'
import Users from 'users/client/components/administration/users.client.components'
import Login from 'users/client/components/authentication/login.client.components'
import Register from 'users/client/components/authentication/register.client.components'

export const routes = [
  {
    private: false,
    route: {
      path: '/register',
      exact: true,
      component: Register
    }
  },
  {
    private: false,
    route: {
      path: '/login',
      exact: true,
      component: Login
    }
  },
  {
    private: true,
    route: {
      path: '/users',
      roles: [ADMIN_ROLE],
      exact: true,
      component: Users
    }
  },
  {
    private: true,
    route: {
      path: '/user/edit/:userName',
      roles: [ADMIN_ROLE],
      component: EditUser
    }
  },
  {
    private: true,
    route: {
      path: '/account',
      component: Account
    }
  },
  {
    private: true,
    route: {
      path: '/user/:userName',
      component: User
    }
  }
];
