import React, { Component } from 'react'
import { connect } from 'react-redux'
import { allowDisplayItem } from 'users/client/services/users.auth.services'
import { getMenuLink } from 'core/client/services/core.menu.services'

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
          <ul className='unstyled main-nav-ul' onClick={this.clickMenu}>
            {buildMenuItems(menuItems, user)}
          </ul>
        </nav>
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
function buildMenuItems (items, user) {

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
      return <Component key={i} />;
    }
  });
}

export default MainMenuContainer
