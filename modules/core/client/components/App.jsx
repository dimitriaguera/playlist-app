/**
 * Created by Dimitri Aguera on 31/08/2017.
 */
import React from 'react';
import Main from './main';
import Loader from './loader';
import AudioBar from 'music/client/components/audiobar/audioBar.client.components';

import style from 'styles/master.scss';

const App = () => (
  <div id="app-container">
    <Main />
    <AudioBar />
    <Loader />
  </div>
);

export default App;
