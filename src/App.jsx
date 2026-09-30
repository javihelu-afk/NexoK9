import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './HomePage'
import DiaryEntry from './DiaryEntry'
import MapaPage from './MapaPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/diario" element={<DiaryEntry />} />
        <Route path="/mapa" element={<MapaPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App