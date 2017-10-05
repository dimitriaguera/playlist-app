import React, { Component } from 'react'
import {Route, Switch} from 'react-router-dom'
import PrivateRoute from 'users/client/components/authorization/privateRoute.client.components.jsx';
import { Container } from 'semantic-ui-react'
import { getRoutes } from 'core/client/services/core.route.services';
import NotFound from './404.jsx'

class Main extends Component {

    constructor() {
        super();
        this.state = {
            routes: buildRoutes(getRoutes()),
        }
    }

    render(){

        const { routes } = this.state;

        return (
            <Container style={{paddingTop:'80px'}}>
                <Switch>
                    {routes}
                    <Route component={NotFound} />
                </Switch>
            </Container>
        )
    };
}

// HELPER
function buildRoutes( routes ) {
    return routes.map( (route, i) => {
        const { props } = route;
        return ( !route.private ) ? <Route key={i} {...props} /> : <PrivateRoute key={i} {...props} />;
    });
}


export default Main