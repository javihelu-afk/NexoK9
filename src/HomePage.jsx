import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from './assets/logo.png'
import './HomePage.css'

function HomePage() {
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const irA = (ruta) => {
    setMenuAbierto(false)
    navigate(ruta)
  }

  return (
    <div className="home-pagina">
      <img src={logo} alt="Nexok9" className="home-logo-fondo" />

      <button
        className="btn-hamburguesa"
        onClick={() => setMenuAbierto(!menuAbierto)}
        aria-label="Abrir menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {menuAbierto && (
        <>
          <div className="menu-overlay" onClick={() => setMenuAbierto(false)} />
          <div className="menu-lateral">
            <button onClick={() => irA('/diario')}>
              🐾 Iniciar ejercicio
            </button>
            <button onClick={() => irA('/mapa')}>
              🗺️ Mapa / Distancia
            </button>
            <button className="btn-proximamente" disabled>
              📋 Historial de trabajo
              <span className="etiqueta-proximamente">Próximamente</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default HomePage