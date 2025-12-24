import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './lib/AuthContext';
import ErrorBoundary from './components/ErrorBoundary'; // Import
import { ToastProvider } from './lib/ToastContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);