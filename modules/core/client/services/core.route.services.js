/**
 * Created by Dimitri Aguera on 21/09/2017.
 */
import RoutesModules from '../../../**/routes/*.client.routes.js';

export const getRoutes = function() {
  const routes = [];

  RoutesModules.map(item => {
    const itemRoutes = item.routes;
    itemRoutes.map(route => {
      routes.push({
        private: route.private,
        props: route.route
      });
    });
  });
  return routes;
};
