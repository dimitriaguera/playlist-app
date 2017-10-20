/**
 * Created by Dimitri Aguera on 31/08/2017.
 */
import React from 'react'
import Header from './header.jsx'
import Main from './main.jsx'
import Loader from './loader.jsx'

const App = () => (

    <div className='app-container'>
        <Header />
        <Main />
        <Loader />
    </div>
);

export default App