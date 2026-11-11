import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { SmoothScroll } from './components/SmoothScroll.jsx';
import { Analytics } from '@vercel/analytics/react';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SmoothScroll>
      <App />
      <Analytics />
    </SmoothScroll>
  </StrictMode>
);

