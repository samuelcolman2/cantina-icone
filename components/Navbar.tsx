
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogoutIcon } from './Icons';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-[#2d3748] border-b-4 border-[#FD7F08]">
      <div className="max-w-[min(98vw,1400px)] mx-auto px-3 h-24 flex items-center justify-between">
        <a className="flex items-center gap-3 text-decoration-none h-full" href="#">
          <img
            src="https://iconecolegioecurso.com.br/wp-content/uploads/2022/08/xlogo_icone_site.png.pagespeed.ic_.QgXP3GszLC.webp"
            alt="Logo Ícone Colégio e Curso"
            className="h-16 w-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = 'https://placehold.co/150x50/eeeeee/333333?text=Logo';
            }}
          />
          <span className="w-0.5 h-[70%] self-center bg-[#FD7F08] rounded-full" aria-hidden="true"></span>
          <span className="font-extrabold tracking-wide text-2xl sm:text-3xl lg:text-4xl leading-none whitespace-nowrap text-[#FD7F08]">
            Cantina Icone
          </span>
        </a>

        {user && (
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-sm text-white/80 hidden md:block truncate max-w-[150px] lg:max-w-xs">{user.email}</span>
            <button
              onClick={logout}
              aria-label="Sair"
              className="flex items-center gap-2 text-sm bg-orange-500/20 text-orange-300 px-3 py-2 rounded-lg hover:bg-orange-500/40 hover:text-white transition-colors"
            >
              <LogoutIcon />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;