import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Das eigene CSS: base.css bindet Bootstrap und die Bootstrap Icons in CSS-Layern ein. Das Theme kommt über
// <link id="theme"> in index.html.
import './styles/base.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('Das Element #root fehlt in index.html.')
}

const root = createRoot(rootElement)
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)
