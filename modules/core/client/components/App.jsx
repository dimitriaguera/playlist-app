/**
 * Created by Dimitri Aguera on 31/08/2017.
 */
import React from 'react'
import Header from './header.jsx'
import Main from './main.jsx'
import Loader from './loader.jsx'

import Audio from 'music/client/components/audio.client.components'

const App = () => (

    <div>
        <Header />
        <Main />
        <Audio />
        <Loader />
    </div>
);

export default App