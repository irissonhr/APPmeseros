import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { User, Shield, ChefHat, Mail, Phone, Plus } from 'lucide-react';
import NuevoPersonalModal from './NuevoPersonalModal'; // <-- NUEVO IMPORT

export default function Personal() {
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // <-- ESTADO DEL MODAL

  useEffect(() => {
    cargarPersonal();
  }, []);

  const cargarPersonal = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (!error) setPersonal(data);
    setLoading(false);
  };

  const cambiarRol = async (id, nuevoRol) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: nuevoRol })
      .eq('id', id);

    if (!error) cargarPersonal();
  };

  const getRolIcon = (rol) => {
    switch (rol) {
      case 'admin':
        return <Shield className="text-red-400 w-5 h-5" />;
      case 'capitan':
        return <ChefHat className="text-yellow-400 w-5 h-5" />;
      default:
        return <User className="text-blue-400 w-5 h-5" />;
    }
  };

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Personal</h1>
          <p className="text-slate-400 mt-1">
            Administra los roles de tus meseros y capitanes.
          </p>
        </div>
        {/* BOTÓN NUEVO */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={20} /> Nuevo Personal
        </button>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            Cargando personal...
          </div>
        ) : personal.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No hay usuarios registrados aún.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-sm">
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Contacto</th>
                <th className="p-4 font-medium">Rol Actual</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personal.map((persona) => (
                <tr
                  key={persona.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-800 p-2 rounded-full">
                        {getRolIcon(persona.role)}
                      </div>
                      <span className="text-white font-medium">
                        {persona.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <Phone size={14} /> {persona.phone || 'Sin teléfono'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                      ${
                        persona.role === 'admin'
                          ? 'bg-red-500/10 text-red-400'
                          : persona.role === 'capitan'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {persona.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <select
                      value={persona.role}
                      onChange={(e) => cambiarRol(persona.id, e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                    >
                      <option value="mesero">Mesero</option>
                      <option value="capitan">Capitán</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      <NuevoPersonalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPersonalCreado={cargarPersonal}
      />
    </div>
  );
}
