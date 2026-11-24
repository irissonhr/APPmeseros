import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import {
  X,
  Plus,
  User,
  Trash2,
  MapPin,
  Calendar,
  DollarSign,
  Receipt,
} from 'lucide-react';
import AsignarPersonalModal from './AsignarPersonalModal';
import GestionPagoModal from './GestionPagoModal';

export default function DetalleEvento({ isOpen, onClose, evento }) {
  const [personalAsignado, setPersonalAsignado] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && evento) {
      cargarAsignaciones();
      cargarPagos();
    }
  }, [isOpen, evento]);

  const cargarAsignaciones = async () => {
    const { data, error } = await supabase
      .from('evento_personal')
      .select(`id, rol_en_evento, tareas_asignadas, profiles ( full_name )`)
      .eq('evento_id', evento.id);

    if (!error) {
      setPersonalAsignado(
        data.map((item) => ({
          ...item,
          profiles: Array.isArray(item.profiles)
            ? item.profiles[0]
            : item.profiles,
        }))
      );
    }
  };

  const cargarPagos = async () => {
    const { data } = await supabase
      .from('pagos')
      .select(`id, monto, tipo, pagado, profiles ( full_name )`)
      .eq('evento_id', evento.id);
    if (data) setPagos(data);
  };

  const eliminarAsignacion = async (id) => {
    if (window.confirm('¿Quitar a esta persona del evento?')) {
      await supabase.from('evento_personal').delete().eq('id', id);
      cargarAsignaciones();
    }
  };

  const marcarComoPagado = async (pagoId) => {
    await supabase.from('pagos').update({ pagado: true }).eq('id', pagoId);
    cargarPagos();
  };

  if (!isOpen || !evento) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-slate-800 bg-slate-950">
          <div>
            <h1 className="text-2xl font-bold text-white">{evento.titulo}</h1>
            <div className="flex gap-4 text-sm text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <Calendar size={16} /> {evento.fecha_evento}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={16} /> {evento.ubicacion || 'Sin ubicación'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido en 2 columnas */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna 1: Personal */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User size={18} /> Personal Asignado
              </h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded-lg flex items-center gap-1 transition"
              >
                <Plus size={14} /> Asignar
              </button>
            </div>

            {personalAsignado.length === 0 ? (
              <div className="text-center py-6 text-slate-500 bg-slate-950 rounded-lg border border-slate-800 border-dashed text-sm">
                No hay personal.
              </div>
            ) : (
              <div className="space-y-2">
                {personalAsignado.map((asignacion) => (
                  <div
                    key={asignacion.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">
                        {asignacion.profiles?.full_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        Tareas: {asignacion.tareas_asignadas || 'Ninguna'}
                      </p>
                    </div>
                    <button
                      onClick={() => eliminarAsignacion(asignacion.id)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna 2: Finanzas */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign size={18} /> Pagos y Cargos
              </h2>
              <button
                onClick={() => setIsPagoModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm rounded-lg flex items-center gap-1 transition"
              >
                <Plus size={14} /> Registrar
              </button>
            </div>

            {pagos.length === 0 ? (
              <div className="text-center py-6 text-slate-500 bg-slate-950 rounded-lg border border-slate-800 border-dashed text-sm">
                No hay movimientos financieros.
              </div>
            ) : (
              <div className="space-y-2">
                {pagos.map((pago) => (
                  <div
                    key={pago.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">
                        {pago.profiles?.full_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`uppercase font-bold ${
                            pago.tipo === 'descuento'
                              ? 'text-red-400'
                              : 'text-green-400'
                          }`}
                        >
                          {pago.tipo}
                        </span>
                        <span className="text-slate-400">${pago.monto}</span>
                      </div>
                    </div>
                    {pago.pagado ? (
                      <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">
                        PAGADO
                      </span>
                    ) : (
                      <button
                        onClick={() => marcarComoPagado(pago.id)}
                        className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded border border-yellow-500/20 hover:bg-yellow-500/20 transition"
                      >
                        MARCAR PAGADO
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AsignarPersonalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventoId={evento.id}
        onAsignado={cargarAsignaciones}
      />
      <GestionPagoModal
        isOpen={isPagoModalOpen}
        onClose={() => setIsPagoModalOpen(false)}
        eventoId={evento.id}
        onPagoRegistrado={cargarPagos}
      />
    </div>
  );
}
