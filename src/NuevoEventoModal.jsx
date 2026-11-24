import { useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { X, Calendar, MapPin, Clock, FileText } from 'lucide-react';

export default function NuevoEventoModal({ isOpen, onClose, onEventoCreado }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para los campos del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    ubicacion: '',
    fecha_evento: '',
    hora_inicio: '',
    hora_fin: '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Obtener el usuario actual para el campo created_by
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Insertar en Supabase
    const { error: insertError } = await supabase.from('eventos').insert([
      {
        ...formData,
        created_by: user.id,
        estado: 'confirmado', // Lo creamos directo como confirmado por ahora
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      // Éxito: limpiamos el form, cerramos modal y avisamos al padre
      setFormData({
        titulo: '',
        descripcion: '',
        ubicacion: '',
        fecha_evento: '',
        hora_inicio: '',
        hora_fin: '',
      });
      setLoading(false);
      onEventoCreado(); // Función para recargar la lista
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header del Modal */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Crear Nuevo Evento</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Título del Evento
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
              <input
                type="text"
                name="titulo"
                required
                value={formData.titulo}
                onChange={handleChange}
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:border-blue-500 outline-none"
                placeholder="Ej. Boda de Juan y María"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Ubicación
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
              <input
                type="text"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:border-blue-500 outline-none"
                placeholder="Ej. Salón Jardín Real"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                <input
                  type="date"
                  name="fecha_evento"
                  required
                  value={formData.fecha_evento}
                  onChange={handleChange}
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Inicio
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                <input
                  type="time"
                  name="hora_inicio"
                  required
                  value={formData.hora_inicio}
                  onChange={handleChange}
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Fin</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                <input
                  type="time"
                  name="hora_fin"
                  required
                  value={formData.hora_fin}
                  onChange={handleChange}
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Descripción / Notas
            </label>
            <textarea
              name="descripcion"
              rows="3"
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg p-3 focus:border-blue-500 outline-none"
              placeholder="Detalles del evento, código de vestimenta, etc."
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
