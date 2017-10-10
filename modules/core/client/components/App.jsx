/**
 * Created by Dimitri Aguera on 31/08/2017.
 */
import React from 'react'
import Header from './header.jsx'
import Main from './main.jsx'
import Loader from './loader.jsx'

import AudioBar from 'music/client/components/audioBar.client.components'

const App = () => (

    <div>
        <Header />
        <Main />
        <AudioBar />
        <Loader />
    </div>
);

export default App