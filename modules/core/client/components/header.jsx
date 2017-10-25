import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Menu } from 'semantic-ui-react'
import { logoutUser } from 'users/client/redux/actions'
import { allowDisplayItem } from 'users/client/services/users.auth.services'
import { getMenuLink } from 'core/client/services/core.menu.services'

class Header extends Component {

    constructor() {
        super();
        this.state = {
            menuItems: getMenuLink(),
        }
    }

    render() {

        const { user } = this.props;
        const { menuItems } = this.state;

        return (
            <header className='app-header-container'>
                <Menu as='nav' fixed='top' size='large'>
                    {buildMenuItems( menuItems, user )}
                </Menu>
            </header>
        )
    }
}

const mapStateToProps = state => {
    return {
        user: state.authenticationStore._user,
    }
};

const HeaderContainer = connect(
    mapStateToProps,
    null
)(Header);


// HELPER
function buildMenuItems( items, user ) {
    console.log('render header');

    return items.map( (item, i) => {

        const { component:Component, isPrivate, hiddenOnAuth, roles } = item;

        // Hide elements if authenticated.
        if ( hiddenOnAuth && user ) {
            return null;
        }
        // Hide elements if non-authenticated or roles no match.
        else if ( isPrivate && !allowDisplayItem( user, roles )) {
            return null;
        }
        // Else, render menu entry element.
        else {
            return <Component key={i} />;
        }
    });
}

export default HeaderContainer