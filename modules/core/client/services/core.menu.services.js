/**
 * Created by Dimitri Aguera on 21/09/2017.
 */
import MenuModules from '../../../**/routes/*.client.menu.js';

export const getMenuLink = function() {
  let filterMenu = {};

  for (let l = MenuModules.length, i = 0; i < l; i++) {
    let menuItems = MenuModules[i].menuItems;
    for (let j = 0, l2 = menuItems.length; j < l2; j++) {
      let tmp = menuItems[j];
      if (!filterMenu[tmp.menuId]) {
        filterMenu[tmp.menuId] = [];
      }
      filterMenu[tmp.menuId].push(tmp);
    }
  }

  return filterMenu;
};
