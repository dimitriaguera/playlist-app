import React, { Component } from 'react'
import { connect } from 'react-redux'
import { allowDisplayItem } from 'users/client/services/users.auth.services'
import { getMenuLink } from 'core/client/services/core.menu.services'

import SelectPlaylist from 'music/client/components/playList/selectPlaylist.client.components'


class MainMenu extends Component {
  constructor () {
    super();

    this.clickMenu = this.clickMenu.bind(this);

    this.state = {
      menuItems: getMenuLink()
    }
  }

  componentDidMount() {
    this.burgerBtn = document.getElementById('btn-nav');
  }

  clickMenu() {
    this.burgerBtn.classList.remove('is-active');
    this.mainSide.classList.remove('menu-is-open');
  }

  render () {
    const { user } = this.props;
    const { menuItems } = this.state;

    return (
      <aside id='main-side' ref={domElmt => this.mainSide = domElmt}>
        <nav>
          <ul className='unstyled global-nav main-nav-ul' onClick={this.clickMenu}>
            {buildMenuItems(menuItems.main, user, {li: 'global-nav-li main-nav-li', cpt: 'global-nav-cpt main-nav-cpt' })}
          </ul>
        </nav>

        {user &&
          <span className='global-nav-logged-user'>{user.username}</span>
        }

        <nav>
          <ul className='unstyled global-nav main-nav user-nav-ul' onClick={this.clickMenu}>
            {buildMenuItems(menuItems.user, user, {li: 'global-nav-li user-nav-li', cpt: 'global-nav-cpt user-nav-cpt' })}
          </ul>
        </nav>

        {user && <SelectPlaylist/>}

      </aside>
    )
  }
}

const mapStateToProps = state => {
  return {
    user: state.authenticationStore._user
  }
};

const MainMenuContainer = connect(
  mapStateToProps,
  null,
  null,
  {
    pure: false
  }
)(MainMenu);


// HELPER
function buildMenuItems (items, user, classes) {

  return items.map((item, i) => {
    const { component: Component, isPrivate, hiddenOnAuth, roles } = item;

    // Hide elements if authenticated.
    if (hiddenOnAuth && user) {
      return null;
    }
    // Hide elements if non-authenticated or roles no match.
    else if (isPrivate && !allowDisplayItem(user, roles)) {
      return null;
    }
    // Else, render menu entry element.
    else {
      return <li className={classes.li} key={i}><Component className={classes.cpt}/></li>;
    }
  });
}

export default MainMenuContainer
