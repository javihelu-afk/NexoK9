import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './HomePage'
import DiaryEntry from './DiaryEntry'
import MapaPage from './MapaPage'
import FichaPerro from './FichaPerro'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/diario" element={<DiaryEntry />} />
        <Route path="/mapa" element={<MapaPage />} />
        <Route path="/ficha-perro" element={<FichaPerro />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App