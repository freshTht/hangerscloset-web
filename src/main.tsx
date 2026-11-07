import React from 'react';
import ReactDOM from 'react-dom/client';
import ui from 'beercss';
import 'material-dynamic-colors';
import './index.css';
import App from './App';
import { initFontPreference } from './lib/fontManager';

// Initialize theme preference
const savedMode = localStorage.getItem('theme-mode');
if (savedMode === 'dark' || savedMode === 'light') {
  ui('mode', savedMode);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  ui('mode', 'dark');
}

// Initialize font preference
initFontPreference();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
