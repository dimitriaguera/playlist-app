/**
 * Created by Dimitri Aguera on 21/09/2017.
 */
import Folder from 'folder/client/components/folder.client.components.jsx';

export const routes = [
    {
        private: false,
        route: {
            path: '/folder',
            exact: true,
            component: Folder,
        },
    },
];
