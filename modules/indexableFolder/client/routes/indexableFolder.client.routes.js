/**
 * Created by Dimitri Aguera on 21/09/2017.
 */
import IndexableFolder from 'indexableFolder/client/components/indexableFolder.client.components.jsx';

export const routes = [
    {
        private: false,
        route: {
            path: '/indexMusic',
            //exact: true,
            component: IndexableFolder,
        },
    },
];
