

import React from 'react';
import { CloseIcon, PencilIcon, TrashIcon } from './Icons';

interface CategoryActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  categoryName: string | null;
}

const CategoryActionsModal: React.FC<CategoryActionsModalProps> = ({ isOpen, onClose, onRename, onDelete, categoryName }) => {
  if (!isOpen || !categoryName) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200" aria-label="Fechar modal"><CloseIcon /></button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Ações para</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 truncate">{categoryName.toUpperCase()}</p>

        <div className="space-y-3">
          <button
            onClick={onRename}
            className="w-full flex items-center justify-center gap-2 text-center py-2.5 px-3 rounded-xl border border-blue-600 bg-blue-600 text-white font-semibold transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PencilIcon />
            Renomear Categoria
          </button>
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 text-center py-2.5 px-3 rounded-xl border border-red-600 bg-red-600 text-white font-semibold transition-all duration-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon />
            Excluir Categoria
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryActionsModal;