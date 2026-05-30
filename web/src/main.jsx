import React from 'react';
import {createRoot} from 'react-dom/client';
import FjordLanding from './fjord/FjordLanding.jsx';
import './fjord/styles/global.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FjordLanding />
  </React.StrictMode>,
);
