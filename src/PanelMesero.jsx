import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Calendar, MapPin, Clock, CheckCircle, AlertCircle, LogOut, MessageSquare, FileText, User, Megaphone, XCircle, AlertTriangle, Users } from 'lucide-react';
import Chat from './Chat';
import GestionEquipoModal from './GestionEquipoModal';

export default function PanelMesero({ user, perfil }) {
  const [misEventos, setMisEventos] = useState([]);
  const [eventoActivo, setEventoActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ultimoAnuncio, setUltimoAnuncio] = useState(null); 
  
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isEquipoModalOpen, setIsEquipoModalOpen] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    cargarMisEventos();
    cargarAnuncioGlobal();
  }, []);

  const cargarMisEventos = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('evento_personal')
      .select(`
        id, confirmado, estado, tareas_asignadas, rol_en_evento,
        eventos ( id, titulo, fecha_evento, hora_inicio, hora_fin, ubicacion, descripcion )
      `)
      .eq('profile_id', user.id);

    if (error) {
      console.error("Error de base de datos:", error);
      alert("Error al cargar eventos: " + error.message);
      setLoading(false);
      return;
    }

    if (data) {
      const eventosLimpios = data
        .map(item => ({
          ...item,
          eventos: Array.isArray(item.eventos) ? item.eventos[0] : item.eventos
        }))
        .filter(item => item.eventos); 
      
      eventosLimpios.sort((a, b) => new Date(a.eventos.fecha_evento) - new Date(b.eventos.fecha_evento));
      setMisEventos(eventosLimpios);
      
      if (eventosLimpios.length > 0) {
        if (eventoActivo) {
          const actualizado = eventosLimpios.find(e => e.id === eventoActivo.id);
          setEventoActivo(actualizado || eventosLimpios[0]);
        } else {
          setEventoActivo(eventosLimpios[0]);
        }
      } else {
        setEventoActivo(null);
      }
    }
    setLoading(false);
  };

  const cargarAnuncioGlobal = async () => {
    const { data, error } = await supabase
      .from('mensajes')
      .select(`contenido, created_at, profiles ( full_name )`)
      .is('evento_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      setUltimoAnuncio({
        ...data,
        profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
      });
    }
  };

  const confirmarAsistencia = async (asignacionId) => {
    const { error } = await supabase
      .from('evento_personal')
      .update({ confirmado: true, estado: 'confirmado' })
      .eq('id', asignacionId);
    if (!error) cargarMisEventos();
  };

  const handleCancelarAsistencia = async () => {
    if (!motivoCancelacion.trim()) return;
    setCancelando(true);
    const { error: updateError } = await supabase
      .from('evento_personal')
      .update({ confirmado: false, estado: 'cancelado' })
      .eq('id', eventoActivo.id);

    if (!updateError) {
      await supabase.from('mensajes').insert([{
        contenido: `🚨 ALERTA DE CANCELACIÓN: ${perfil.full_name} ha cancelado su asistencia. Motivo: ${motivoCancelacion}`,
        profile_id: user.id,
        evento_id: eventoActivo.eventos.id
      }]);
      setIsCancelModalOpen(false);
      setMotivoCancelacion('');
      cargarMisEventos();
    }
    setCancelando(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const getEstadoBadge = (estado, confirmado) => {
    if (estado === 'cancelado') return { text: 'Cancelado', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: <XCircle size={14} /> };
    if (confirmado) return { text: 'Confirmado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle size={14} /> };
    return { text: 'Pendiente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Clock size={14} /> };
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans">
      <nav className="bg-zinc-950 border-b border-zinc-800 p-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-light tracking-wide text-white">Hola, <span className="font-bold">{perfil?.full_name}</span></h1>
          {/* DEBUG: Mostramos el rol del perfil y del evento */}
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">
            Rol DB: {perfil?.role} | Evento: {eventoActivo?.rol_en_evento}
          </p>
        </div>
        <button onClick={handleLogout} className="text-zinc-500 hover:text-white flex items-center gap-2 transition-colors duration-300 text-sm border border-transparent hover:border-zinc-700 px-3 py-1.5 rounded-lg">
          <LogOut size={16} /> Salir
        </button>
      </nav>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
        
        <div className="lg:col-span-2 overflow-y-auto p-6 space-y-6">
          
          {ultimoAnuncio && (
            <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-4 flex gap-4 items-start shadow-lg">
              <div className="bg-zinc-800 p-2 rounded-lg text-zinc-300 shrink-0 mt-1 border border-zinc-700">
                <Megaphone size={20} />
              </div>
              <div>
                <h4 className="text-zinc-300 font-bold text-xs uppercase tracking-widest mb-1">Comunicado Oficial</h4>
                <p className="text-zinc-200 text-sm italic">"{ultimoAnuncio.contenido}"</p>
                <p className="text-zinc-500 text-[10px] mt-2">{ultimoAnuncio.profiles?.full_name || 'Admin'} • {new Date(ultimoAnuncio.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center text-zinc-500 py-10">Cargando eventos...</div>
          ) : !eventoActivo ? (
            <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-10 text-center">
              <AlertCircle className="mx-auto text-zinc-600 mb-3" size={40} />
              <h3 className="text-lg text-zinc-300 font-medium">Sin eventos asignados</h3>
            </div>
          ) : (
            <div className="space-y-6">
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                
                <div className={`px-6 py-4 text-xs font-bold uppercase tracking-widest flex justify-between items-center border-b border-zinc-800 bg-zinc-950/50`}>
                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getEstadoBadge(eventoActivo.estado, eventoActivo.confirmado).color}`}>
                    {getEstadoBadge(eventoActivo.estado, eventoActivo.confirmado).icon}
                    {getEstadoBadge(eventoActivo.estado, eventoActivo.confirmado).text}
                  </span>
                  
                  <div className="flex gap-2">
                    
                    {/* VALIDACIÓN A PRUEBA DE FALLOS: Busca la palabra "capit" sin importar mayúsculas o acentos */}
                    {perfil?.role?.toLowerCase().includes('capit') && (
                      <button 
                        onClick={() => setIsEquipoModalOpen(true)} 
                        className="bg-zinc-100 text-black hover:bg-white transition-colors text-xs flex items-center gap-1 px-3 py-1 rounded font-bold shadow-sm"
                      >
                        <Users size={14} /> Mi Equipo
                      </button>
                    )}
                    
                    {eventoActivo.estado !== 'cancelado' && (
                      <button 
                        onClick={() => setIsCancelModalOpen(true)} 
                        className="text-red-400 hover:text-red-300 transition-colors text-xs flex items-center gap-1 border border-red-500/30 hover:bg-red-500/10 px-2 py-1 rounded"
                      >
                        Cancelar
                      </button>
                    )}
                    {!eventoActivo.confirmado && eventoActivo.estado !== 'cancelado' && (
                      <button onClick={() => confirmarAsistencia(eventoActivo.id)} className="bg-zinc-100 hover:bg-white text-black px-3 py-1 rounded text-[10px] transition-colors shadow-sm">
                        Confirmar
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="text-3xl font-light tracking-wide text-white mb-6">{eventoActivo.eventos.titulo}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-sm text-zinc-400">
                    <p className="flex items-center gap-3"><Calendar size={18} className="text-zinc-600"/> {eventoActivo.eventos.fecha_evento}</p>
                    <p className="flex items-center gap-3"><Clock size={18} className="text-zinc-600"/> {eventoActivo.eventos.hora_inicio} - {eventoActivo.eventos.hora_fin}</p>
                    <p className="flex items-center gap-3"><MapPin size={18} className="text-zinc-600"/> {eventoActivo.eventos.ubicacion || 'Por confirmar'}</p>
                    <p className="flex items-center gap-3"><User size={18} className="text-zinc-600"/> Puesto: <span className="uppercase font-bold text-zinc-200 tracking-wider text-xs">{eventoActivo.rol_en_evento}</span></p>
                  </div>

                  <div className="bg-zinc-950/50 p-5 rounded-lg border border-zinc-800 mb-6">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><FileText size={14}/> Descripción</h4>
                    <p className="text-zinc-300 text-sm leading-relaxed font-light">{eventoActivo.eventos.descripcion || 'No hay descripción.'}</p>
                  </div>

                  <div className="bg-zinc-800/30 p-5 rounded-lg border border-zinc-700/50">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-2">Tus Tareas Asignadas</h4>
                    <p className="text-zinc-100 font-medium text-sm">{eventoActivo.tareas_asignadas || 'Sin tareas específicas.'}</p>
                  </div>
                </div>
              </div>

              {misEventos.length > 1 && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Otros Eventos</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {misEventos.filter(e => e.id !== eventoActivo.id).map(evento => (
                      <button 
                        key={evento.id}
                        onClick={() => setEventoActivo(evento)}
                        className="bg-zinc-900 border border-zinc-800 hover:border-zinc-500 p-4 rounded-xl text-left min-w-[200px] transition-all duration-300 group"
                      >
                        <p className="text-zinc-200 font-medium text-sm truncate group-hover:text-white">{evento.eventos.titulo}</p>
                        <p className="text-xs text-zinc-500 mt-1">{evento.eventos.fecha_evento}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-950 flex flex-col h-[calc(100vh-73px)]">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center gap-2 shrink-0">
            <MessageSquare className="text-zinc-500" size={18} />
            <h2 className="font-medium text-zinc-300 text-sm tracking-wide">Chat del Evento</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            {eventoActivo ? <Chat user={user} isCompact={true} eventoId={eventoActivo.eventos.id} /> : <div className="p-6 text-center text-zinc-600 text-sm">Selecciona un evento.</div>}
          </div>
        </div>
      </div>

      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded-full text-red-400"><AlertTriangle size={24} /></div>
              <div>
                <h2 className="text-lg font-bold text-white">Cancelar Asistencia</h2>
                <p className="text-xs text-zinc-400">Esta acción notificará al administrador.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Motivo de cancelación</label>
                <textarea rows="3" value={motivoCancelacion} onChange={(e) => setMotivoCancelacion(e.target.value)} className="w-full bg-zinc-950 text-white border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:border-red-500 transition-colors" placeholder="Ej. Problemas de salud..."></textarea>
              </div>
            </div>
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end gap-3">
              <button onClick={() => setIsCancelModalOpen(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Volver</button>
              <button onClick={handleCancelarAsistencia} disabled={cancelando || !motivoCancelacion.trim()} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
                {cancelando ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {eventoActivo && (
        <GestionEquipoModal 
          isOpen={isEquipoModalOpen} 
          onClose={() => setIsEquipoModalOpen(false)} 
          eventoId={eventoActivo.eventos.id} 
          nombreEvento={eventoActivo.eventos.titulo}
        />
      )}
    </div>
  );
}