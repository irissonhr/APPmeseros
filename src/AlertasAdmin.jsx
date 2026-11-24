import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { AlertTriangle, Clock } from 'lucide-react';

export default function AlertasAdmin() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    setLoading(true);
    // Buscamos mensajes que contengan el icono de alerta en CUALQUIER evento (no nulo)
    const { data, error } = await supabase
      .from('mensajes')
      .select(
        `
        id, contenido, created_at,
        eventos ( titulo ),
        profiles ( full_name )
      `
      )
      .not('evento_id', 'is', null) // Excluimos el chat global
      .ilike('contenido', '%🚨%') // Buscamos el emoji de alerta
      .order('created_at', { ascending: false });

    if (!error && data) {
      const limpias = data.map((a) => ({
        ...a,
        eventos: Array.isArray(a.eventos) ? a.eventos[0] : a.eventos,
        profiles: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
      }));
      setAlertas(limpias);
    }
    setLoading(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mt-6">
      <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
        <AlertTriangle className="text-red-500" size={16} /> Alertas del Sistema
      </h3>

      {loading ? (
        <p className="text-zinc-500 text-sm">Buscando alertas...</p>
      ) : alertas.length === 0 ? (
        <p className="text-zinc-600 text-sm italic">
          No hay alertas recientes en ningún evento.
        </p>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
          {alertas.map((alerta) => (
            <div
              key={alerta.id}
              className="bg-red-950/30 border border-red-900/50 p-3 rounded-lg flex gap-3 items-start"
            >
              <AlertTriangle
                className="text-red-500 shrink-0 mt-0.5"
                size={16}
              />
              <div>
                <p className="text-red-400 text-sm font-medium">
                  {alerta.contenido}
                </p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-red-500/70">
                  <span className="font-bold uppercase">
                    {alerta.eventos?.titulo || 'Evento'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />{' '}
                    {new Date(alerta.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
