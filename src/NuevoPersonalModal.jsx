import { useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { X, User, Mail, Lock, Phone } from 'lucide-react';

export default function NuevoPersonalModal({
  isOpen,
  onClose,
  onPersonalCreado,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'mesero',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Creamos el usuario en Auth de Supabase
    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name, // El trigger lo tomará de aquí
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Si se creó el usuario, actualizamos su teléfono y rol en la tabla profiles
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone,
          role: formData.role,
        })
        .eq('id', data.user.id);

      if (profileError) {
        setError(
          'Usuario creado, pero hubo un error al guardar el teléfono: ' +
            profileError.message
        );
        setLoading(false);
        return;
      }
    }

    // Éxito
    setLoading(false);
    setFormData({
      full_name: '',
      email: '',
      password: '',
      phone: '',
      role: 'mesero',
    });
    onPersonalCreado(); // Recargar la tabla en Personal.jsx
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">
            Registrar Nuevo Personal
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
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:border-blue-500 outline-none"
                placeholder="Ej. Juan Pérez"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:border-blue-500 outline-none"
                placeholder="juan@eventos.com"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Contraseña Provisional
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:border-blue-500 outline-none"
                placeholder="Ej. Eventos2024!"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              El empleado usará esta contraseña para entrar la primera vez.
            </p>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:border-blue-500 outline-none"
                placeholder="Ej. 555-123-4567"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Rol Inicial
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg py-2 px-4 focus:border-blue-500 outline-none"
            >
              <option value="mesero">Mesero</option>
              <option value="capitan">Capitán</option>
            </select>
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar Personal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
