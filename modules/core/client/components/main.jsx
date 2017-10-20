import React, { Component } from 'react'
import {Route, Switch} from 'react-router-dom'
import PrivateRoute from 'users/client/components/authorization/privateRoute.client.components.jsx';
import { Container, Sidebar } from 'semantic-ui-react'
import { getRoutes } from 'core/client/services/core.route.services';
import NotFound from './404.jsx'
import AudioBar from 'music/client/components/audioBar.client.components'

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
            <div className='app-main-container'>
            <Container style={{paddingTop:'80px'}}>
                <Switch>
                    {routes}
                    <Route component={NotFound} />
                </Switch>
            </Container>
            <AudioBar />
            </div>
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