import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { LogIn, Mail, Lock, Plus, Calendar, MapPin, User, Phone, UserPlus, Megaphone } from 'lucide-react'
import Sidebar from './Sidebar'
import NuevoEventoModal from './NuevoEventoModal'
import NuevoPersonalModal from './NuevoPersonalModal'
import DetalleEvento from './DetalleEvento'
import Personal from './Personal'
import Chat from './Chat'
import PanelMesero from './PanelMesero'
import AlertasAdmin from './AlertasAdmin'

function App() {
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mensajeExito, setMensajeExito] = useState(null)

  const [eventos, setEventos] = useState([])
  const [personal, setPersonal] = useState([])
  const [isEventoModalOpen, setIsEventoModalOpen] = useState(false)
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false)
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null)
  const [currentView, setCurrentView] = useState('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      cargarPerfil(session.user.id);
      cargarEventos()
      cargarPersonal()
    } else {
      setPerfil(null);
    }
  }, [session])

  const cargarPerfil = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setPerfil(data);
  }

  const cargarEventos = async () => {
    const { data } = await supabase.from('eventos').select('*').order('fecha_evento', { ascending: true })
    if (data) setEventos(data)
  }

  const cargarPersonal = async () => {
    const { data } = await supabase.from('profiles').select('*').order('full_name', { ascending: true })
    if (data) setPersonal(data)
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setMensajeExito(null)
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
      if (error) setError(error.message)
      else {
        setMensajeExito('¡Cuenta creada! Ya puedes iniciar sesión.')
        setIsRegistering(false); setPassword('')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center app-bg p-4">
        <div className="w-full max-w-md app-card p-10 animate-slide-up">
          <div className="text-center mb-8">
            <div className="bg-zinc-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-700 shadow-xl">
              {isRegistering ? <UserPlus className="text-white w-8 h-8" /> : <LogIn className="text-white w-8 h-8" />}
            </div>
            <h1 className="text-2xl font-light tracking-wide text-white">{isRegistering ? 'Crear Cuenta' : 'Acceso al Sistema'}</h1>
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          {mensajeExito && <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg mb-4 text-sm">{mensajeExito}</div>}
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-zinc-500 w-5 h-5" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full app-input rounded-xl py-3 pl-10 pr-4" placeholder="Nombre Completo" required={isRegistering} />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-zinc-500 w-5 h-5" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full app-input rounded-xl py-3 pl-10 pr-4" placeholder="correo@empresa.com" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-zinc-500 w-5 h-5" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full app-input rounded-xl py-3 pl-10 pr-4" placeholder="Contraseña" required />
            </div>
            <button type="submit" disabled={loading} className="w-full btn-accent py-3 rounded-xl mt-2">
              {loading ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setError(null); setMensajeExito(null); }} className="text-sm text-zinc-400 hover:text-white transition-colors">
              {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿Eres nuevo? Solicita acceso'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!perfil) return <div className="min-h-screen app-bg flex items-center justify-center text-zinc-500">Cargando perfil...</div>

  if (perfil.role === 'mesero' || perfil.role === 'capitan') {
    return <PanelMesero user={session.user} perfil={perfil} />;
  }

  return (
    <div className="flex h-screen app-bg font-sans">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="flex-1 overflow-hidden flex flex-col h-full">
        
        {currentView === 'dashboard' && (
          <div className="overflow-y-auto p-8 h-full animate-slide-up">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-light tracking-wide text-white">Panel de Control</h1>
                <p className="text-zinc-500 mt-1 text-sm">Gestión general de la operación.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setIsPersonalModalOpen(true)} className="btn-outline px-4 py-2 rounded-xl flex items-center gap-2">
                  <User size={18} /> Nuevo Mesero
                </button>
                <button onClick={() => setIsEventoModalOpen(true)} className="btn-accent px-4 py-2 rounded-xl flex items-center gap-2">
                  <Plus size={18} /> Nuevo Evento
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="app-card p-6">
                <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Eventos Activos</h3>
                <p className="text-4xl font-light text-white">{eventos.length}</p>
              </div>
              <div className="app-card p-6">
                <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Personal Total</h3>
                <p className="text-4xl font-light text-white">{personal.length}</p>
              </div>
              <div className="app-card p-6">
                <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Pagos Pendientes</h3>
                <p className="text-4xl font-light text-white">$0.00</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Próximos Eventos</h2>
                {eventos.length === 0 ? (
                  <div className="text-center py-12 app-card border-dashed text-zinc-600">No hay eventos programados.</div>
                ) : (
                  <div className="space-y-3">
                    {eventos.map((evento) => (
                      <div key={evento.id} onClick={() => setEventoSeleccionado(evento)} className="app-card app-card-hover p-5 flex justify-between items-center cursor-pointer group">
                        <div>
                          <h3 className="text-white font-medium text-lg group-hover:text-white transition-colors">{evento.titulo}</h3>
                          <div className="flex gap-6 text-sm text-zinc-500 mt-2">
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {evento.fecha_evento}</span>
                          </div>
                        </div>
                        <div className="text-sm text-zinc-400 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-zinc-800">{evento.hora_inicio} - {evento.hora_fin}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Staff Reciente</h2>
                <div className="app-card overflow-hidden">
                  {personal.length === 0 ? (
                    <div className="p-6 text-center text-zinc-600 text-sm">No hay personal.</div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {personal.slice(0, 5).map((persona) => (
                        <div key={persona.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors duration-200">
                          <div className="p-2.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-400">
                            <User size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="text-zinc-200 text-sm font-medium">{persona.full_name}</p>
                            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5"><Phone size={12} /> {persona.phone || 'Sin tel.'}</p>
                          </div>
                          <span className={`badge ${persona.role === 'admin' ? 'badge-danger' : persona.role === 'capitan' ? 'badge-warning' : 'badge-success'}`}>
                            {persona.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'personal' && <div className="overflow-y-auto h-full"><Personal /></div>}
        
        {currentView === 'chat' && (
          <div className="flex flex-col h-full animate-slide-up">
            <div className="bg-zinc-900/50 backdrop-blur-md border-b border-white/5 p-4 shrink-0">
              <h2 className="text-white font-medium text-lg flex items-center gap-2">
                <Megaphone className="text-zinc-400" /> Centro de Comunicaciones
              </h2>
              <p className="text-zinc-500 text-sm mt-1">Envía anuncios globales y revisa las alertas de los eventos.</p>
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 bg-zinc-950/30 shrink-0">
                <AlertasAdmin />
              </div>
              <div className="flex-1 overflow-hidden">
                <Chat user={session.user} />
              </div>
            </div>
          </div>
        )}
      </main>

      <NuevoEventoModal isOpen={isEventoModalOpen} onClose={() => setIsEventoModalOpen(false)} onEventoCreado={cargarEventos} />
      <NuevoPersonalModal isOpen={isPersonalModalOpen} onClose={() => setIsPersonalModalOpen(false)} onPersonalCreado={cargarPersonal} />
      <DetalleEvento isOpen={!!eventoSeleccionado} onClose={() => setEventoSeleccionado(null)} evento={eventoSeleccionado} />
    </div>
  )
}

export default App