import React from 'react';
import ReactDOM from 'react-dom/client';
import ui from 'beercss';
import 'beercss';
import 'material-dynamic-colors';
import './index.css';
import App from './App';

// Initialize theme preference
const savedMode = localStorage.getItem('theme-mode');
if (savedMode === 'dark' || savedMode === 'light') {
  ui('mode', savedMode);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  ui('mode', 'dark');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
