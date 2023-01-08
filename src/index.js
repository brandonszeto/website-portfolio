import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import Projects from './components/projects';
import Experiences from './components/experiences';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <div class="EntirePage">
        <div class="ContentContainer">
            <h1>Brandon</h1>
            <h1>Szeto's</h1>
            <h1>Website</h1>
            <Experiences />
            <Projects />
        </div>
   </div>
);
