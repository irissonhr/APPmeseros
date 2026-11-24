import { LayoutDashboard, Users, MessageSquare, LogOut } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

export default function Sidebar({ currentView, setCurrentView }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const NavButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setCurrentView(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
        currentView === id
          ? 'bg-zinc-800 text-white shadow-md border-l-2 border-white'
          : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-l-2 border-transparent'
      }`}
    >
      <Icon size={20} /> {label}
    </button>
  );

  return (
    <div className="w-64 bg-zinc-950 text-white h-screen flex flex-col border-r border-zinc-800 shrink-0">
      <div className="p-6 border-b border-zinc-800">
        <h2 className="text-xl font-light tracking-widest text-zinc-100 uppercase">
          Eventos<span className="font-bold text-white">App</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-1 tracking-wider uppercase">
          Administración
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <NavButton id="dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavButton id="personal" icon={Users} label="Directorio" />
        <NavButton id="chat" icon={MessageSquare} label="Anuncios" />
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
        >
          <LogOut size={20} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
