import { BrowserRouter, Routes, Route } from 'react-router-dom'
import StayDeskPage from './pages/StayDeskPage'
import ReservationsPage from './pages/ReservationsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StayDeskPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
