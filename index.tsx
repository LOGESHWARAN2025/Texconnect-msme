import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('index.tsx: Starting app...');

try {
  const rootElement = document.getElementById('root');
  console.log('index.tsx: Root element found:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  ReactDOM.createRoot(rootElement).render(
    <App />
  );
  
  console.log('index.tsx: App rendered successfully');
} catch (error) {
  console.error('index.tsx: Error rendering app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; background: #fee; color: #c00; font-family: monospace;">
      <h1>Application Error</h1>
      <pre>${error}</pre>
    </div>
  `;
}
