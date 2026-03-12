import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

// Global error handlers for debugging production issues
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global Error:', { message, source, lineno, colno, error });
};

window.onunhandledrejection = (event) => {
  const reason = event.reason;
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error('Unhandled Rejection:', {
    message,
    stack: reason instanceof Error ? reason.stack : undefined,
    reason
  });
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
