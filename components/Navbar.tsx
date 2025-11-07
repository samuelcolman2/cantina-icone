import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  LogoutIcon,
  GridIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  ChevronLeftIcon,
  BoxIcon,
  UsersIcon,
} from './Icons';
import UserProfileModal from './UserProfileModal';

type ActiveView = 'products' | 'dashboard' | 'products_management' | 'stock_management' | 'user_management';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isAdmin }) => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navItems = [
    { id: 'products', label: 'Produtos', icon: <GridIcon />, adminOnly: false },
    { id: 'dashboard', label: 'Faturamento', icon: <ChartBarIcon />, adminOnly: true },
    { id: 'products_management', label: 'Gerenciar', icon: <WrenchScrewdriverIcon />, adminOnly: true },
    { id: 'stock_management', label: 'Estoque', icon: <BoxIcon />, adminOnly: true },
    { id: 'user_management', label: 'Usuários', icon: <UsersIcon />, adminOnly: true },
  ];
  
  const accessibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      <aside className={`relative bg-[#222b39] text-white flex flex-col transition-all duration-300 ease-in-out sticky top-0 h-screen ${isCollapsed ? 'w-[72px]' : 'w-64'}`}>
        <div className={`flex items-center p-4 border-b border-white/10 h-24 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
          <div className={`flex items-center gap-2 overflow-hidden`}>
              <img
                  src="https://storage.googleapis.com/ecdt-logo-saida/1ebe52af502e25d3521cb9dad62bb72f6bc1c347353cdda5fa381ef8627a9eb8/COLEGIO-E-CURSO-ICONE.webp"
                  alt="Logo Ícone Colégio e Curso"
                  className="h-10 w-10 flex-shrink-0"
              />
              <span className={`font-bold text-lg whitespace-nowrap text-white transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-1'}`}>
                  CANTINA ICONE
              </span>
          </div>
        </div>

        <nav className="flex-grow p-2 overflow-y-auto">
          <ul>
            {accessibleNavItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveView(item.id as ActiveView)}
                  title={item.label}
                  className={`w-full flex items-center gap-3 rounded-lg text-left p-3 my-1 transition-colors ${
                    activeView === item.id 
                    ? 'bg-[#FD7F08] text-white font-semibold shadow-md' 
                    : 'hover:bg-white/10 text-slate-300'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  {item.icon}
                  <span className={`whitespace-nowrap transition-opacity ${isCollapsed ? 'sr-only' : 'opacity-100'}`}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-2 border-t border-white/10 shrink-0">
          <button
              onClick={() => setIsProfileModalOpen(true)}
              title="Editar Perfil"
              className={`w-full flex items-center p-2 rounded-lg gap-3 text-left hover:bg-white/10 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
              {user?.photoURL ? (
                  <img src={user.photoURL} alt="Foto de perfil" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                  <UserIcon className="w-8 h-8 shrink-0 p-1 bg-slate-600 rounded-full" />
              )}
              <div className={`overflow-hidden transition-opacity ${isCollapsed ? 'sr-only' : 'opacity-100'}`}>
                  <span className="text-sm font-medium block truncate max-w-[150px]">
                      {user?.displayName || user?.email}
                  </span>
              </div>
          </button>
          <button
            onClick={logout}
            title="Sair"
            className={`w-full flex items-center gap-3 rounded-lg text-left p-3 my-1 transition-colors bg-white/5 hover:bg-red-500/20 text-red-300 hover:text-red-200 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogoutIcon />
            <span className={`whitespace-nowrap transition-opacity ${isCollapsed ? 'sr-only' : 'opacity-100'}`}>Sair</span>
          </button>
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 bg-[#222b39] border-2 border-slate-600 rounded-full w-7 h-7 grid place-items-center text-slate-400 hover:text-white hover:bg-[#FD7F08] hover:border-[#FD7F08] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#222b39] focus:ring-[#FD7F08] z-10"
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          <ChevronLeftIcon className={`transition-transform duration-300 w-5 h-5 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`} />
        </button>
      </aside>

      {isProfileModalOpen && (
        <UserProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
        />
      )}
    </>
  );
};

export default Sidebar;
