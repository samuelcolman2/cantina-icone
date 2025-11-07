import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from './Icons';

interface ThemeToggleProps {
  isCollapsed: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isCollapsed }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
      className={`w-full flex items-center gap-3 rounded-lg text-left p-3 my-1 transition-colors hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 ${isCollapsed ? 'justify-center' : ''}`}
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      <span className={`whitespace-nowrap transition-opacity ${isCollapsed ? 'sr-only' : 'opacity-100'}`}>
        {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
      </span>
    </button>
  );
};

export default ThemeToggle;
