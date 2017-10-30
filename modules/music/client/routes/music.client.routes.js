/**
 * Created by Dimitri Aguera on 21/09/2017.
 */
import AllPlaylist from 'music/client/components/allPlaylist.client.components';
import Playlist from 'music/client/components/playlist.client.components';
import Album from 'music/client/components/album.client.components';

export const routes = [
    {
        private: false,
        route: {
            path: '/',
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
    {
        private: false,
        route: {
            path: '/album/:title',
            component: Album,
        },
    },
];
