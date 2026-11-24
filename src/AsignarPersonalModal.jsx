import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { X, UserPlus, FileText } from 'lucide-react';

export default function AsignarPersonalModal({ isOpen, onClose, eventoId, onAsignado }) {
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    profile_id: '',
    rol_en_evento: 'mesero',
    tareas_asignadas: ''
  });

  useEffect(() => {
    if (isOpen) {
      cargarPersonal();
    }
  }, [isOpen]);

  const cargarPersonal = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, role').neq('role', 'admin');
    if (data) setPersonal(data);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase
      .from('evento_personal')
      .insert([{
        evento_id: eventoId,
        profile_id: formData.profile_id,
        rol_en_evento: formData.rol_en_evento,
        tareas_asignadas: formData.tareas_asignadas
      }]);

    if (insertError) {
      // Si intentan asignar a la misma persona dos veces, saltará un error
      setError(insertError.message);
      setLoading(false);
    } else {
      setLoading(false);
      onAsignado(); // Recargar la lista en el componente padre
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Asignar al Evento</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="text-sm text-slate-300 mb-1 block">Seleccionar Persona</label>
            <div className="relative">
              <UserPlus className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
              <select 
                required
                value={formData.profile_id} 
                onChange={(e) => setFormData({...formData, profile_id: e.target.value})}
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:border-blue-500 outline-none"
              >
                <option value="">-- Elige a alguien --</option>
                {personal.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">Rol en este Evento</label>
            <select 
              value={formData.rol_en_evento} 
              onChange={(e) => setFormData({...formData, rol_en_evento: e.target.value})}
              className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 px-4 focus:border-blue-500 outline-none"
            >
              <option value="mesero">Mesero</option>
              <option value="capitan">Capitán</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">Tareas Asignadas (Opcional)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
              <textarea 
                rows="2"
                value={formData.tareas_asignadas} 
                onChange={(e) => setFormData({...formData, tareas_asignadas: e.target.value})}
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg p-3 pl-10 focus:border-blue-500 outline-none" 
                placeholder="Ej. Barra, Mesas 1-5, Montaje..."
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">Cancelar</button>
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50">
              {loading ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}