import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, storage } from './firebase'
import { collection, addDoc, updateDoc, doc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import './FichaPerro.css'

const VACIO = {
  nombre: '',
  sexo: 'macho',
  fechaNacimiento: '',
  chip: '',
  fechaChip: '',
  especialidad: '',
  notas: '',
  fotoURL: '',
}

function FichaPerro() {
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const [perros, setPerros] = useState([])
  const [perroIdActual, setPerroIdActual] = useState(null)
  const [form, setForm] = useState(VACIO)
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [cargandoLista, setCargandoLista] = useState(true)

  const irA = (ruta) => {
    setMenuAbierto(false)
    navigate(ruta)
  }

  const cargarLista = async () => {
    setCargandoLista(true)
    try {
      const q = query(collection(db, 'perros'), orderBy('nombre'))
      const snap = await getDocs(q)
      setPerros(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (error) {
      console.error('Error cargando perros:', error)
    }
    setCargandoLista(false)
  }

  useEffect(() => {
    cargarLista()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFotoFile(file)
      setFotoPreview(URL.createObjectURL(file))
    }
  }

  const seleccionarPerro = (e) => {
    const id = e.target.value
    if (!id) {
      setPerroIdActual(null)
      setForm(VACIO)
      setFotoFile(null)
      setFotoPreview('')
      return
    }
    const perro = perros.find((p) => p.id === id)
    if (perro) {
      setPerroIdActual(id)
      setForm({
        nombre: perro.nombre || '',
        sexo: perro.sexo || 'macho',
        fechaNacimiento: perro.fechaNacimiento || '',
        chip: perro.chip || '',
        fechaChip: perro.fechaChip || '',
        especialidad: perro.especialidad || '',
        notas: perro.notas || '',
        fotoURL: perro.fotoURL || '',
      })
      setFotoFile(null)
      setFotoPreview(perro.fotoURL || '')
    }
  }

  const nuevoPerro = () => {
    setPerroIdActual(null)
    setForm(VACIO)
    setFotoFile(null)
    setFotoPreview('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      let idUsado = perroIdActual
      let fotoURL = form.fotoURL

      if (!idUsado) {
        const nuevoDoc = await addDoc(collection(db, 'perros'), { ...form, creado: serverTimestamp() })
        idUsado = nuevoDoc.id
        setPerroIdActual(idUsado)
      }

      if (fotoFile) {
        const storageRef = ref(storage, `perros/${idUsado}/foto.jpg`)
        await uploadBytes(storageRef, fotoFile)
        fotoURL = await getDownloadURL(storageRef)
      }

      await updateDoc(doc(db, 'perros', idUsado), { ...form, fotoURL })

      alert('Ficha guardada')
      setFotoFile(null)
      await cargarLista()
    } catch (error) {
      console.error('Error guardando ficha:', error)
      alert('Error al guardar la ficha')
    }
    setGuardando(false)
  }

  return (
    <>
      <button
        className="perro-btn-hamburguesa"
        onClick={() => setMenuAbierto(!menuAbierto)}
        aria-label="Abrir menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {menuAbierto && (
        <>
          <div className="perro-menu-overlay" onClick={() => setMenuAbierto(false)} />
          <div className="perro-menu-lateral">
            <button onClick={() => irA('/')}>← Portada</button>
            <button onClick={() => irA('/diario')}>📋 Diario</button>
            <button onClick={() => irA('/mapa')}>🗺️ Mapa / Distancia</button>
          </div>
        </>
      )}

      <form className="perro-card" onSubmit={handleSubmit}>
        <h2>Ficha K9</h2>

        <label>
          Perro guardado
          <select value={perroIdActual || ''} onChange={seleccionarPerro} disabled={cargandoLista}>
            <option value="">— Nuevo perro —</option>
            {perros.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </label>

        {perroIdActual && (
          <button type="button" className="btn-nuevo-perro" onClick={nuevoPerro}>
            + Crear otra ficha
          </button>
        )}

        <label>
          Nombre
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre del perro" />
        </label>

        <label>
          Foto del perro
          <div
            className="foto-cuadro"
            onClick={() => document.getElementById('input-foto-perro').click()}
          >
            {fotoPreview ? (
              <img src={fotoPreview} alt="Foto del perro" className="foto-preview" />
            ) : (
              <span className="foto-placeholder">+ Añadir foto</span>
            )}
          </div>
          <input
            id="input-foto-perro"
            type="file"
            accept="image/*"
            onChange={handleFotoChange}
            style={{ display: 'none' }}
          />
        </label>

        <div className="row">
          <label>
            Sexo
            <select name="sexo" value={form.sexo} onChange={handleChange}>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </label>
          <label>
            Fecha de nacimiento
            <input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} />
          </label>
        </div>

        <div className="row">
          <label>
            Nº de chip
            <input name="chip" value={form.chip} onChange={handleChange} placeholder="Nº de identificación" />
          </label>
          <label>
            Fecha de implantación
            <input type="date" name="fechaChip" value={form.fechaChip} onChange={handleChange} />
          </label>
        </div>

        <label>
          Especialidad
          <input name="especialidad" value={form.especialidad} onChange={handleChange} placeholder="Ej: Explosivos" />
        </label>

        <label>
          Notas
          <textarea name="notas" value={form.notas} onChange={handleChange} rows="3" />
        </label>

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar ficha'}
        </button>

        <button type="button" className="btn-proximamente" disabled>
          🩺 Veterinaria
          <span className="etiqueta-proximamente">Próximamente</span>
        </button>
      </form>
    </>
  )
}

export default FichaPerro