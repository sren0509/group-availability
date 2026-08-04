import { Routes, Route, Navigate } from 'react-router-dom'
import CreateEvent from './CreateEvent'
import EventPage from './EventPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CreateEvent />} />
      <Route path="/e/:id" element={<EventPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
