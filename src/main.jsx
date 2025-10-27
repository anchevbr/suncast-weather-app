import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Disable StrictMode in production to avoid double API calls
// StrictMode intentionally double-invokes effects in development to help find bugs
// but this causes unnecessary API rate limit issues with our external APIs
const isDevelopment = import.meta.env.DEV;

ReactDOM.createRoot(document.getElementById('root')).render(
  isDevelopment ? (
    <App />
  ) : (
    <StrictMode>
      <App />
    </StrictMode>
  ),
)
