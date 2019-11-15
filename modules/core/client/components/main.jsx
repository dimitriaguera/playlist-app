import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import PrivateRoute from 'users/client/components/authorization/privateRoute.client.components';
import { getRoutes } from 'core/client/services/core.route.services';
import NotFound from './404';
import MainMenu from './mainMenu';

class Main extends Component {
  constructor() {
    super();
    this.state = {
      routes: buildRoutes(getRoutes())
    };

    this.clickBurger = this.clickBurger.bind(this);
  }

  componentDidMount() {
    this.mainSide = document.getElementById('main-side');
  }

  clickBurger(e) {
    this.domElmt.classList.toggle('is-active');
    this.mainSide.classList.toggle('menu-is-open');
    e.stopPropagation();
  }

  render() {
    const { routes } = this.state;

    return (
      <div id="side-and-main-container">
        <MainMenu />
        <main id="main-content">
          <button
            id="btn-nav"
            ref={domElmt => (this.domElmt = domElmt)}
            className="nav-button large-hidden medium-hidden"
            onClick={e => this.clickBurger(e)}
            type="button"
            role="button"
            aria-label="open/close navigation"
          >
            <i aria-hidden="true"></i>
          </button>
          <Switch>
            {routes}
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    );
  }
}

// HELPER
function buildRoutes(routes) {
  return routes.map((route, i) => {
    const { props } = route;
    return !route.private ? (
      <Route key={i} {...props} />
    ) : (
      <PrivateRoute key={i} {...props} />
    );
  });
}

export default Main;
