import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { X, DollarSign, FileText } from 'lucide-react';

export default function GestionPagoModal({
  isOpen,
  onClose,
  eventoId,
  onPagoRegistrado,
}) {
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    profile_id: '',
    monto: '',
    tipo: 'sueldo',
    notas: '',
  });

  useEffect(() => {
    if (isOpen) {
      cargarPersonalAsignado();
    }
  }, [isOpen, eventoId]);

  const cargarPersonalAsignado = async () => {
    // Solo traemos a la gente asignada a ESTE evento
    const { data } = await supabase
      .from('evento_personal')
      .select('profile_id, profiles(full_name)')
      .eq('evento_id', eventoId);

    if (data) {
      const personalLimpio = data.map((item) => ({
        id: item.profile_id,
        nombre: Array.isArray(item.profiles)
          ? item.profiles[0].full_name
          : item.profiles.full_name,
      }));
      setPersonal(personalLimpio);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from('pagos').insert([
      {
        evento_id: eventoId,
        profile_id: formData.profile_id,
        monto: parseFloat(formData.monto),
        tipo: formData.tipo,
        notas: formData.notas,
        pagado: false, // Por defecto se crea como pendiente de pago
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      setLoading(false);
      setFormData({ profile_id: '', monto: '', tipo: 'sueldo', notas: '' });
      onPagoRegistrado();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">
            Registrar Pago / Cargo
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Seleccionar Mesero/Capitán
            </label>
            <select
              required
              value={formData.profile_id}
              onChange={(e) =>
                setFormData({ ...formData, profile_id: e.target.value })
              }
              className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 px-4 focus:border-blue-500 outline-none"
            >
              <option value="">-- Elige a quién pagar --</option>
              {personal.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Monto ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
              <input
                type="number"
                step="0.01"
                required
                value={formData.monto}
                onChange={(e) =>
                  setFormData({ ...formData, monto: e.target.value })
                }
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:border-blue-500 outline-none"
                placeholder="Ej. 500.00"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Tipo de Movimiento
            </label>
            <select
              value={formData.tipo}
              onChange={(e) =>
                setFormData({ ...formData, tipo: e.target.value })
              }
              className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 px-4 focus:border-blue-500 outline-none"
            >
              <option value="sueldo">Sueldo Base</option>
              <option value="anticipo">Anticipo</option>
              <option value="bono">Bono / Propina</option>
              <option value="descuento">Descuento / Cargo</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Notas (Opcional)
            </label>
            <textarea
              rows="2"
              value={formData.notas}
              onChange={(e) =>
                setFormData({ ...formData, notas: e.target.value })
              }
              className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg p-3 focus:border-blue-500 outline-none"
              placeholder="Ej. Se le descontó por romper un vaso..."
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
