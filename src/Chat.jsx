import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { Send, User, MessageSquare } from 'lucide-react';

export default function Chat({ user, isCompact = false, eventoId = null }) {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const finalChatRef = useRef(null);

  useEffect(() => {
    cargarMensajes();
    const filtro = eventoId ? `evento_id=eq.${eventoId}` : 'evento_id=is.null';
    const canal = supabase.channel(`chat_${eventoId || 'general'}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes', filter: filtro }, payload => {
        fetchProfile(payload.new);
      }).subscribe();
    return () => supabase.removeChannel(canal);
  }, [eventoId]);

  useEffect(() => {
    if (finalChatRef.current) finalChatRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const cargarMensajes = async () => {
    setLoading(true); setDbError(null);
    let query = supabase.from('mensajes').select(`id, contenido, created_at, profile_id, evento_id, profiles ( full_name )`).order('created_at', { ascending: true });
    if (eventoId) query = query.eq('evento_id', eventoId);
    else query = query.is('evento_id', null);

    const { data, error } = await query;
    if (error) setDbError(error.message);
    else {
      setMensajes(data.map(m => ({ ...m, profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles })));
    }
    setLoading(false);
  };

  const fetchProfile = async (mensajeNuevo) => {
    const { data } = await supabase.from('profiles').select('full_name').eq('id', mensajeNuevo.profile_id).single();
    setMensajes(prev => [...prev, { ...mensajeNuevo, profiles: data }]);
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;
    const mensajeAEnviar = nuevoMensaje;
    setNuevoMensaje('');
    await supabase.from('mensajes').insert([{ contenido: mensajeAEnviar, profile_id: user.id, evento_id: eventoId }]);
  };

  return (
    <div className={`flex flex-col h-full app-bg ${isCompact ? '' : 'p-8'}`}>
      {!isCompact && (
        <header className="mb-6">
          <h1 className="text-2xl font-light tracking-wide text-white flex items-center gap-2">
            <MessageSquare className="text-zinc-500"/> 
            {eventoId ? 'Chat del Evento' : 'Anuncios Globales'}
          </h1>
        </header>
      )}

      <div className={`flex-1 app-card flex flex-col overflow-hidden ${isCompact ? '' : 'shadow-2xl'}`}>
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {dbError && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm border border-red-500/20">{dbError}</div>}
          {loading ? (
            <div className="text-center text-zinc-500 mt-10">Cargando...</div>
          ) : mensajes.length === 0 ? (
            <div className="text-center text-zinc-600 mt-10 italic">
              {eventoId ? 'No hay mensajes en este evento.' : 'No hay anuncios publicados.'}
            </div>
          ) : (
            mensajes.map((msg) => {
              const esMio = msg.profile_id === user.id;
              const esAlerta = msg.contenido.includes('🚨');
              
              return (
                <div key={msg.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 shadow-md ${
                    esAlerta 
                      ? 'bg-red-950/40 border border-red-900/50 text-red-200'
                      : esMio 
                        ? 'bg-zinc-200 text-black rounded-br-none' 
                        : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700'
                  }`}>
                    <p className={`text-[10px] font-bold mb-1 flex items-center gap-1 ${
                      esAlerta ? 'text-red-400' : esMio ? 'text-zinc-600 justify-end' : 'text-zinc-400'
                    }`}>
                      <User size={10} /> {msg.profiles?.full_name || 'Usuario'}
                    </p>
                    
                    <p className={`text-sm ${esAlerta ? 'text-red-400 font-bold' : ''}`}>
                      {msg.contenido}
                    </p>
                    
                    <p className={`text-[9px] mt-1 text-right ${esMio ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={finalChatRef} />
        </div>

        <div className="p-3 bg-zinc-950/50 border-t border-zinc-800">
          <form onSubmit={enviarMensaje} className="flex gap-2">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 app-input rounded-lg px-3 py-2 text-sm"
            />
            <button type="submit" className="btn-accent p-2 rounded-lg">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}