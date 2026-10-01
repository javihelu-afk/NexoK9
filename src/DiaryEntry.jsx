import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from './firebase'
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore'
import './DiaryEntry.css'

const TIPOS_EJERCICIO = [
  'Reconocimiento de interiores',
  'Reconocimiento de vehículos',
  'Paquetería',
  'Punto crítico a distancia',
  'Área abierta / exteriores',
  'Embarcaciones',
]

const RESULTADOS = [
  { valor: 'encontrada', etiqueta: 'Sustancia encontrada' },
  { valor: 'no_encontrada', etiqueta: 'Sustancia no encontrada' },
  { valor: 'en_blanco', etiqueta: 'Trabajo en blanco' },
]

const UNIDADES_TEMP = [
  { valor: 'C', etiqueta: '°C' },
  { valor: 'F', etiqueta: '°F' },
  { valor: 'K', etiqueta: 'K' },
]

const UNIDADES_VIENTO = [
  { valor: 'kmh', etiqueta: 'km/h' },
  { valor: 'ms', etiqueta: 'm/s' },
  { valor: 'mph', etiqueta: 'mph' },
  { valor: 'kt', etiqueta: 'knots' },
  { valor: 'fts', etiqueta: 'pies/s' },
]

function gradosACardinal(grados) {
  const puntos = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
  const index = Math.round(grados / 45) % 8
  return puntos[index]
}

function fechaHoyISO() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

function horaAhora() {
  const d = new Date()
  return d.toTimeString().slice(0, 5)
}

function convertirTemperatura(valor, desde, hacia) {
  if (valor === '' || valor === null || isNaN(valor)) return valor
  const v = Number(valor)
  if (desde === hacia) return v

  let celsius
  if (desde === 'C') celsius = v
  else if (desde === 'F') celsius = (v - 32) * (5 / 9)
  else if (desde === 'K') celsius = v - 273.15

  let resultado
  if (hacia === 'C') resultado = celsius
  else if (hacia === 'F') resultado = celsius * (9 / 5) + 32
  else if (hacia === 'K') resultado = celsius + 273.15

  return Math.round(resultado * 10) / 10
}

function convertirViento(valor, desde, hacia) {
  if (valor === '' || valor === null || isNaN(valor)) return valor
  const v = Number(valor)
  if (desde === hacia) return v

  const factoresAKmh = { kmh: 1, ms: 3.6, mph: 1.60934, kt: 1.852, fts: 1.09728 }

  const kmh = v * factoresAKmh[desde]
  const resultado = kmh / factoresAKmh[hacia]

  return Math.round(resultado * 10) / 10
}

function DiaryEntry() {
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const [form, setForm] = useState({
    perro: '',
    fecha: fechaHoyISO(),
    hora: horaAhora(),
    tipoEjercicio: TIPOS_EJERCICIO[0],
    resultado: 'encontrada',
    tiempoTrabajo: '',
    temperatura: '',
    temperaturaUnidad: 'C',
    humedad: '',
    vientoVelocidad: '',
    vientoUnidad: 'kmh',
    vientoDireccion: '',
    lat: '',
    lon: '',
    sustancia: '',
    cantidad: '',
    unidad: 'gramos',
    notas: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [cargandoClima, setCargandoClima] = useState(false)
  const [errorClima, setErrorClima] = useState('')

  const [mostrarSelectorPerro, setMostrarSelectorPerro] = useState(false)
  const [cargandoPerros, setCargandoPerros] = useState(false)
  const [perrosGuardados, setPerrosGuardados] = useState([])

  const irA = (ruta) => {
    setMenuAbierto(false)
    navigate(ruta)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const cambiarUnidadTemp = (e) => {
    const nuevaUnidad = e.target.value
    const nuevoValor = convertirTemperatura(form.temperatura, form.temperaturaUnidad, nuevaUnidad)
    setForm({ ...form, temperatura: nuevoValor, temperaturaUnidad: nuevaUnidad })
  }

  const cambiarUnidadViento = (e) => {
    const nuevaUnidad = e.target.value
    const nuevoValor = convertirViento(form.vientoVelocidad, form.vientoUnidad, nuevaUnidad)
    setForm({ ...form, vientoVelocidad: nuevoValor, vientoUnidad: nuevaUnidad })
  }

  const abrirSelectorPerro = async () => {
    setMostrarSelectorPerro(true)
    if (perrosGuardados.length > 0) return
    setCargandoPerros(true)
    try {
      const q = query(collection(db, 'perros'), orderBy('nombre'))
      const snap = await getDocs(q)
      setPerrosGuardados(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (error) {
      console.error('Error cargando perros:', error)
    }
    setCargandoPerros(false)
  }

  const seleccionarPerroGuardado = (e) => {
    const nombre = e.target.value
    if (nombre) {
      setForm((prev) => ({ ...prev, perro: nombre }))
    }
    setMostrarSelectorPerro(false)
  }

  const cargarClima = () => {
    setErrorClima('')
    if (!navigator.geolocation) {
      setErrorClima('Este navegador no soporta geolocalización')
      return
    }

    setCargandoClima(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m`
          const res = await fetch(url)
          const data = await res.json()
          const actual = data.current

          setForm((prev) => ({
            ...prev,
            lat: latitude.toFixed(5),
            lon: longitude.toFixed(5),
            temperatura: convertirTemperatura(Math.round(actual.temperature_2m), 'C', prev.temperaturaUnidad),
            humedad: Math.round(actual.relative_humidity_2m),
            vientoVelocidad: convertirViento(Math.round(actual.wind_speed_10m), 'kmh', prev.vientoUnidad),
            vientoDireccion: gradosACardinal(actual.wind_direction_10m),
          }))
        } catch (error) {
          console.error('Error obteniendo clima:', error)
          setErrorClima('No se pudo obtener el clima. Rellena manualmente.')
        }
        setCargandoClima(false)
      },
      (error) => {
        console.error('Error de geolocalización:', error)
        setErrorClima('No se pudo obtener tu ubicación. Revisa los permisos del navegador.')
        setCargandoClima(false)
      }
    )
  }

  const irAlMapa = () => {
    const params = new URLSearchParams({
      lat: form.lat,
      lon: form.lon,
      temp: form.temperatura,
      tempUnidad: form.temperaturaUnidad,
      hum: form.humedad,
      viento: form.vientoVelocidad,
      vientoUnidad: form.vientoUnidad,
      direccion: form.vientoDireccion,
    })
    navigate(`/mapa?${params.toString()}`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const datosAGuardar = { ...form, fecha: serverTimestamp(), fechaTexto: form.fecha, horaTexto: form.hora }

      if (form.resultado === 'en_blanco') {
        datosAGuardar.sustancia = null
        datosAGuardar.cantidad = null
      }

      await addDoc(collection(db, 'registros'), datosAGuardar)
      alert('Registro guardado')
      setForm({
        perro: '',
        fecha: fechaHoyISO(),
        hora: horaAhora(),
        tipoEjercicio: TIPOS_EJERCICIO[0],
        resultado: 'encontrada',
        tiempoTrabajo: '',
        temperatura: '',
        temperaturaUnidad: 'C',
        humedad: '',
        vientoVelocidad: '',
        vientoUnidad: 'kmh',
        vientoDireccion: '',
        lat: '',
        lon: '',
        sustancia: '',
        cantidad: '',
        unidad: 'gramos',
        notas: '',
      })
    } catch (error) {
      console.error('Error guardando:', error)
      alert('Error al guardar el registro')
    }
    setGuardando(false)
  }

  return (
    <>
      <button
        className="diary-btn-hamburguesa"
        onClick={() => setMenuAbierto(!menuAbierto)}
        aria-label="Abrir menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {menuAbierto && (
        <>
          <div className="diary-menu-overlay" onClick={() => setMenuAbierto(false)} />
          <div className="diary-menu-lateral">
            <button onClick={() => irA('/')}>
              ← Portada
            </button>
            <button onClick={() => irA('/ficha-perro')}>
              🐕 Ficha K9
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

      <form className="diary-card" onSubmit={handleSubmit}>
        <h2>Nuevo registro</h2>

        <label>
          Perro
          <div className="campo-con-boton">
            <input name="perro" value={form.perro} onChange={handleChange} placeholder="Nombre del perro" />
            <button type="button" className="btn-cargar-k9" onClick={abrirSelectorPerro}>
              🐕 Cargar K9
            </button>
          </div>
        </label>

        {mostrarSelectorPerro && (
          <div className="selector-perro">
            {cargandoPerros ? (
              <p className="texto-selector-perro">Cargando perros...</p>
            ) : perrosGuardados.length === 0 ? (
              <p className="texto-selector-perro">No hay perros guardados. Ve a "Ficha K9" para crear uno.</p>
            ) : (
              <select autoFocus defaultValue="" onChange={seleccionarPerroGuardado}>
                <option value="" disabled>Selecciona un perro</option>
                {perrosGuardados.map((p) => (
                  <option key={p.id} value={p.nombre}>{p.nombre}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="row">
          <label>
            Fecha
            <input type="date" name="fecha" value={form.fecha} onChange={handleChange} />
          </label>
          <label>
            Hora
            <input type="time" name="hora" value={form.hora} onChange={handleChange} />
          </label>
        </div>

        <label>
          Tipo de ejercicio
          <select name="tipoEjercicio" value={form.tipoEjercicio} onChange={handleChange}>
            {TIPOS_EJERCICIO.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </label>

        <div className="row">
          <label>
            Resultado
            <select name="resultado" value={form.resultado} onChange={handleChange}>
              {RESULTADOS.map((r) => (
                <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
              ))}
            </select>
          </label>

          <label>
            Tiempo de trabajo (min)
            <input
              type="number"
              name="tiempoTrabajo"
              value={form.tiempoTrabajo}
              onChange={handleChange}
              placeholder="Ej: 5"
            />
          </label>
        </div>

        <button
          type="button"
          className="btn-clima"
          onClick={cargarClima}
          disabled={cargandoClima}
        >
          {cargandoClima ? 'Obteniendo ubicación y clima...' : '📍 Meteorología'}
        </button>
        {errorClima && <p className="error-clima">{errorClima}</p>}

        {form.lat && (
          <>
            <p className="coords-info">
              Ubicación: {form.lat}, {form.lon}
            </p>
            <iframe
              className="mini-mapa"
              title="Ubicación del ejercicio"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(form.lon) - 0.01}%2C${Number(form.lat) - 0.01}%2C${Number(form.lon) + 0.01}%2C${Number(form.lat) + 0.01}&layer=mapnik&marker=${form.lat}%2C${form.lon}`}
            />
            <button type="button" className="btn-mapa" onClick={irAlMapa}>
              🛰️ Mapa/Distancia
            </button>
          </>
        )}

        <div className="row">
          <label>
            Temperatura
            <div className="campo-con-unidad">
              <input type="number" name="temperatura" value={form.temperatura} onChange={handleChange} step="0.1" />
              <select value={form.temperaturaUnidad} onChange={cambiarUnidadTemp}>
                {UNIDADES_TEMP.map((u) => (
                  <option key={u.valor} value={u.valor}>{u.etiqueta}</option>
                ))}
              </select>
            </div>
          </label>
          <label>
            Humedad (%)
            <input type="number" name="humedad" value={form.humedad} onChange={handleChange} />
          </label>
        </div>

        <div className="row">
          <label>
            Viento
            <div className="campo-con-unidad">
              <input type="number" name="vientoVelocidad" value={form.vientoVelocidad} onChange={handleChange} step="0.1" />
              <select value={form.vientoUnidad} onChange={cambiarUnidadViento}>
                {UNIDADES_VIENTO.map((u) => (
                  <option key={u.valor} value={u.valor}>{u.etiqueta}</option>
                ))}
              </select>
            </div>
          </label>
          <label>
            Dirección viento
            <input name="vientoDireccion" value={form.vientoDireccion} onChange={handleChange} placeholder="Ej: NE" />
          </label>
        </div>

        {form.resultado !== 'en_blanco' && (
          <>
            <label>
              Sustancia
              <input name="sustancia" value={form.sustancia} onChange={handleChange} placeholder="Ej: TNT, C4, Hachís" />
            </label>

            <div className="row">
              <label>
                Cantidad
                <input type="number" name="cantidad" value={form.cantidad} onChange={handleChange} />
              </label>

              <label>
                Unidad
                <select name="unidad" value={form.unidad} onChange={handleChange}>
                  <option value="gramos">gramos</option>
                  <option value="kilos">kilos</option>
                </select>
              </label>
            </div>
          </>
        )}

        <label>
          Notas
          <textarea name="notas" value={form.notas} onChange={handleChange} rows="3" />
        </label>

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar registro'}
        </button>
      </form>
    </>
  )
}

export default DiaryEntry