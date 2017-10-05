/**
 * Created by Dimitri Aguera on 21/09/2017.
 */
import Home from 'home/client/components/home.client.components.jsx';

export const routes = [
    {
        private: false,
        route: {
            path: '/',
            exact: true,
            component: Home,
        },
    },
];
