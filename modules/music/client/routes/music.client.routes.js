/**
 * Created by Dimitri Aguera on 21/09/2017.
 */
import AllPlaylist from 'music/client/components/allPlaylist.client.components';
import Playlist from 'music/client/components/playlist.client.components';

export const routes = [
    {
        private: false,
        route: {
            path: '/allPlaylist',
            exact: true,
            component: AllPlaylist,
        },
    },
    {
        private: false,
        route: {
            path: '/playlist/:title',
            component: Playlist,
        },
    },
];
