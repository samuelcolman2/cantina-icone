import React, { useState, useEffect } from 'react';
import { ref, set } from 'firebase/database';
import { db } from '../firebase/config';
import { CloseIcon } from './Icons';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewCategoryName('');
      setFeedback(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!newCategoryName.trim()) {
      setFeedback({ type: 'error', message: 'O nome da categoria não pode ser vazio.' });
      return;
    }
    setIsLoading(true);
    try {
      const categoryRef = ref(db, `categories/${newCategoryName.trim()}`);
      await set(categoryRef, true);
      setFeedback({ type: 'success', message: `Categoria "${newCategoryName.trim()}" criada com sucesso!` });
      setNewCategoryName('');
      setTimeout(() => {
        onClose();
      }, 1500); // Close modal after success
    } catch (error) {
      console.error("Error creating category:", error);
      setFeedback({ type: 'error', message: 'Erro ao criar categoria.' });
      setIsLoading(false);
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
          aria-label="Fechar modal"
        >
          <CloseIcon />
        </button>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Criar Nova Categoria</h2>
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1" htmlFor="category-name">
              Nome da Categoria
            </label>
            <input 
              id="category-name" 
              type="text" 
              value={newCategoryName} 
              onChange={(e) => setNewCategoryName(e.target.value)} 
              required 
              className="appearance-none border border-slate-300 bg-white rounded-md w-full py-2 px-3 text-slate-800 placeholder-slate-400 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              placeholder="Ex: Bebidas"
            />
          </div>
          
          {feedback && (
              <p className={`text-sm p-3 rounded-md border ${feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  {feedback.message}
              </p>
          )}

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Criando...' : 'Criar Categoria'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;