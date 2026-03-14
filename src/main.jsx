import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GymTracker from './GymTracker.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GymTracker />
  </StrictMode>,
)
