import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { X, User, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function GestionEquipoModal({ isOpen, onClose, eventoId, nombreEvento }) {
  const [equipo, setEquipo] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && eventoId) {
      cargarEquipo();
    }
  }, [isOpen, eventoId]);

  const cargarEquipo = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('evento_personal')
      .select(`
        id, rol_en_evento, confirmado, estado, tareas_asignadas,
        profiles ( full_name, phone )
      `)
      .eq('evento_id', eventoId);

    if (!error && data) {
      setEquipo(data.map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      })));
    }
    setLoading(false);
  };

  const confirmarMesero = async (asignacionId) => {
    await supabase
      .from('evento_personal')
      .update({ confirmado: true, estado: 'confirmado' })
      .eq('id', asignacionId);
    cargarEquipo();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-950">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="text-zinc-400" /> Gestión de Equipo
            </h2>
            <p className="text-zinc-500 text-sm mt-1">{nombreEvento}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white bg-zinc-800 p-2 rounded-lg transition"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center text-zinc-500">Cargando equipo...</div>
          ) : equipo.length === 0 ? (
            <div className="text-center text-zinc-500">No hay personal asignado.</div>
          ) : (
            <div className="space-y-3">
              {equipo.map(miembro => (
                <div key={miembro.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium flex items-center gap-2">
                      {miembro.profiles?.full_name}
                      {miembro.rol_en_evento === 'capitan' && (
                        <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">CAPITÁN</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Tareas: {miembro.tareas_asignadas || 'Ninguna'}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {miembro.estado === 'cancelado' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20"><XCircle size={12}/> CANCELADO</span>
                    ) : miembro.confirmado ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"><CheckCircle size={12}/> CONFIRMADO</span>
                    ) : (
                      <button 
                        onClick={() => confirmarMesero(miembro.id)}
                        className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 hover:bg-amber-500/20 transition"
                      >
                        <Clock size={12}/> CONFIRMAR
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}