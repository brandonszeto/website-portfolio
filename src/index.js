import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import Projects from './components/projects';
import Experiences from './components/experiences';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <div class="EntirePage">
        <div class="ContentContainer">
            <h1>Jenny</h1>
            <Experiences />
            <Projects />
        </div>
   </div>
);
