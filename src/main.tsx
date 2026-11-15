import React from 'react';
import ReactDOM from 'react-dom/client';
import ui from 'beercss';
import 'material-dynamic-colors';
import './index.css';
import App from './App';
import { initFontPreference } from './lib/fontManager';
import { initColorPreference } from './lib/themeColorManager';

// Initialize theme preference
const savedMode = localStorage.getItem('theme-mode');
if (savedMode === 'dark' || savedMode === 'light') {
  ui('mode', savedMode);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  ui('mode', 'dark');
}

// Initialize theme color preference
initColorPreference();

// Initialize font preference
initFontPreference();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
