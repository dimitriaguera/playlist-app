/**
 * Created by Dimitri Aguera on 21/09/2017.
 */
import MenuModules from '../../../**/routes/*.client.menu.js';

export const getMenuLink = function() {

    const menuItems = [];

    MenuModules.map( item => {
        item.menuItems.map( menuItem => {
            menuItems.push(menuItem);
        });
    });
    return menuItems;
};
