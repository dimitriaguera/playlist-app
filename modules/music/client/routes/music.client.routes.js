/**
 * Created by Dimitri Aguera on 21/09/2017.
 */
import AllPlaylist from 'music/client/components/allPlaylist.client.components';
import Playlist from 'music/client/components/playlist.client.components';
import Album from 'music/client/components/album.client.components';
import FolderList from 'music/client/components/folderList.client.components';
import Albums from 'music/client/components/albums.client.components';
import Queue from 'music/client/components/queue.client.components';
import AllTracks from 'music/client/components/allTracks.client.components';

export const routes = [
  {
    private: false,
    route: {
      path: '/',
      exact: true,
      component: AllPlaylist
    }
  },
  {
    private: false,
    route: {
      path: '/playlist/:title',
      component: Playlist
    }
  },
  {
    private: true,
    route: {
      path: '/queue',
      exact: true,
      component: Queue
    }
  },
  {
    private: false,
    route: {
      path: '/album',
      component: Album
    }
  },
  {
    private: false,
    route: {
      path: '/list/folder',
      component: FolderList
    }
  },
  {
    private: false,
    route: {
      path: '/albums',
      component: Albums
    }
  },
  {
    private: false,
    route: {
      path: '/tracks',
      component: AllTracks
    }
  }
];
