import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapaPage.css'

const iconoBase = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const iconoSustancia = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function ClicksEnMapa({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng)
    },
  })
  return null
}

function MapaPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const lat = parseFloat(searchParams.get('lat'))
  const lon = parseFloat(searchParams.get('lon'))
  const temp = searchParams.get('temp')
  const tempUnidad = searchParams.get('tempUnidad') || 'C'
  const hum = searchParams.get('hum')
  const viento = searchParams.get('viento')
  const vientoUnidad = searchParams.get('vientoUnidad') || 'km/h'
  const direccion = searchParams.get('direccion')

  const puntoBase = { lat, lng: lon }
  const [puntoSustancia, setPuntoSustancia] = useState(null)

  const distancia =
    puntoSustancia != null
      ? Math.round(L.latLng(puntoBase).distanceTo(L.latLng(puntoSustancia)))
      : null

  if (isNaN(lat) || isNaN(lon)) {
    return (
      <div className="mapa-pagina">
        <p>No hay ubicación cargada. Ve al diario y pulsa "Meteorología" primero.</p>
        <div className="mapa-nav">
          <button onClick={() => navigate('/')}>← Portada</button>
          <button onClick={() => navigate('/diario')}>📋 Ir al diario</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mapa-pagina">
      <div className="mapa-header">
        <div className="mapa-nav">
          <button className="btn-volver" onClick={() => navigate('/')}>← Portada</button>
          <button className="btn-volver" onClick={() => navigate('/diario')}>📋 Diario</button>
        </div>
        <div className="meteo-resumen">
          {temp && <span>🌡️ {temp}°{tempUnidad}</span>}
          {hum && <span>💧 {hum}%</span>}
          {viento && <span>💨 {viento} {vientoUnidad} {direccion}</span>}
        </div>
      </div>

      <MapContainer center={[lat, lon]} zoom={18} className="mapa-leaflet">
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <Marker position={puntoBase} icon={iconoBase} />
        {puntoSustancia && <Marker position={puntoSustancia} icon={iconoSustancia} />}
        {puntoSustancia && (
          <Polyline positions={[puntoBase, puntoSustancia]} pathOptions={{ color: '#ef4444', weight: 3 }} />
        )}
        <ClicksEnMapa onClick={setPuntoSustancia} />
      </MapContainer>

      <div className="mapa-footer">
        <p className="instrucciones">
          El marcador azul es tu punto de partida. Toca en el mapa donde está el explosivo para medir la distancia.
        </p>
        {distancia !== null && (
          <p className="distancia-resultado">
            Distancia: <strong>{distancia} m</strong>
          </p>
        )}
        {puntoSustancia && (
          <button className="btn-reset" onClick={() => setPuntoSustancia(null)}>
            Borrar punto
          </button>
        )}
      </div>
    </div>
  )
}

export default MapaPage