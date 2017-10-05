import React, { Component } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { connect } from 'react-redux'

import { Loader } from 'semantic-ui-react'
import bootstrap from '../redux/bootstrap'
import App from './App.jsx';

/**
 * Boot component permit to threat async actions before calling App,
 * for exemple to check if token exist on sessionStorage,
 * and set store to authenticated.
 *
 */
class Boot extends Component {

    // Start boot process.
    componentWillMount(){
        bootstrap();
    }

    render() {
        const isBooted = this.props.isBooted;
        // Application's tags
        const application = (
            <BrowserRouter>
                <App />
            </BrowserRouter>
        );

        // Loader's tags
        const onBoot = (
            <Loader active/>
        );

        // If boot session end, call App.
        // Else, call Loader.
        return (
            <div>
                {isBooted ? application : onBoot}
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        isBooted: state.bootStore.isBooted,
    }
};

export default connect(mapStateToProps)(Boot);