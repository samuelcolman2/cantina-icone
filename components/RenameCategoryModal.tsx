

import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';

interface RenameCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
  currentName: string;
  existingCategories: string[];
}

const RenameCategoryModal: React.FC<RenameCategoryModalProps> = ({ isOpen, onClose, onRename, currentName, existingCategories }) => {
  const [newName, setNewName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedNewName = newName.trim().toUpperCase();

    if (!trimmedNewName) {
      setError('O nome não pode ser vazio.');
      return;
    }
    if (trimmedNewName.toUpperCase() === currentName.toUpperCase()) {
      onClose();
      return;
    }
    if (existingCategories.some(cat => cat.toUpperCase() === trimmedNewName)) {
      setError(`A categoria "${trimmedNewName.toUpperCase()}" já existe.`);
      return;
    }

    setIsLoading(true);
    try {
      await onRename(trimmedNewName);
      onClose();
    } catch (err) {
      setError('Ocorreu um erro ao renomear. Tente novamente.');
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-8 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200" aria-label="Fechar modal"><CloseIcon /></button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Renomear Categoria</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1" htmlFor="new-category-name">
              Novo nome para "{currentName.toUpperCase()}"
            </label>
            <input
              id="new-category-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="appearance-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md w-full py-2 px-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
          {error && <p className="text-red-600 text-xs text-center">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-md text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameCategoryModal;