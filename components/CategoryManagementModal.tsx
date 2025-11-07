
import React, { useState, useEffect } from 'react';
import { ref, onValue, set, update, get } from 'firebase/database';
import { db } from '../firebase/config';
import { ProductCategory } from '../types';
import { CloseIcon, GearIcon } from './Icons';
import Spinner from './Spinner';
import CategoryActionsModal from './CategoryActionsModal';
import ConfirmationModal from './ConfirmationModal';
import RenameCategoryModal from './RenameCategoryModal';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ isOpen, onClose }) => {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [error, setError] = useState<string | null>(null);

    // State for actions modal
    const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // State for rename and delete modals
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        setIsLoading(true);
        const categoriesRef = ref(db, 'categories');
        const unsubscribe = onValue(categoriesRef, (snapshot) => {
            const data = snapshot.val();
            setCategories(data ? Object.keys(data).sort() : []);
            setIsLoading(false);
        }, (error) => {
            console.error(error);
            setError("Falha ao carregar categorias.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen]);
    
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newCategoryName.trim();
        if (!trimmedName) {
            setError("O nome da categoria não pode ser vazio.");
            return;
        }
        if (categories.some(cat => cat.toLowerCase() === trimmedName.toLowerCase())) {
            setError(`A categoria "${trimmedName}" já existe.`);
            return;
        }

        try {
            await set(ref(db, `categories/${trimmedName}`), true);
            setNewCategoryName('');
            setError(null);
        } catch (err) {
            setError("Ocorreu um erro ao adicionar a categoria.");
            console.error(err);
        }
    };
    
    const handleRequestRename = (categoryName: string) => {
        setCategoryToEdit(categoryName);
        setIsRenameModalOpen(true);
    };

    const confirmRenameCategory = async (newName: string) => {
        if (!categoryToEdit) return;
        const oldName = categoryToEdit;

        try {
            const updates: { [key: string]: any } = {};
            updates[`/categories/${oldName}`] = null;
            updates[`/categories/${newName}`] = true;

            const productsSnapshot = await get(ref(db, 'products'));
            if (productsSnapshot.exists()) {
                const productsData = productsSnapshot.val();
                Object.keys(productsData).forEach(productId => {
                    if (productsData[productId].category === oldName) {
                        updates[`/products/${productId}/category`] = newName;
                    }
                });
            }
            await update(ref(db), updates);
        } catch (err) {
            console.error(err);
            // Re-throw to be caught by the modal
            throw err;
        } finally {
            setCategoryToEdit(null);
        }
    };

    const handleRequestDelete = (categoryName: string) => {
        setCategoryToEdit(categoryName);
        setIsConfirmDeleteOpen(true);
    };

    const confirmDeleteCategory = async () => {
        if (!categoryToEdit) return;

        try {
            const updates: { [key: string]: null | true } = {};
            updates[`/categories/${categoryToEdit}`] = null;
            
            const productsSnapshot = await get(ref(db, 'products'));
            if (productsSnapshot.exists()) {
                const productsData = productsSnapshot.val();
                Object.keys(productsData).forEach(productId => {
                    if (productsData[productId].category === categoryToEdit) {
                        updates[`/products/${productId}`] = null;
                    }
                });
            }
            await update(ref(db), updates);
        } catch (err) {
            alert("Ocorreu um erro ao excluir a categoria.");
            console.error(err);
        } finally {
            setCategoryToEdit(null);
            setIsConfirmDeleteOpen(false);
        }
    };

    const openActionsModal = (categoryName: string) => {
        setSelectedCategory(categoryName);
        setIsActionsModalOpen(true);
    };

    const handleRenameFromActions = () => {
        if (selectedCategory) {
            handleRequestRename(selectedCategory);
        }
        setIsActionsModalOpen(false);
    };

    const handleDeleteFromActions = () => {
        if (selectedCategory) {
            handleRequestDelete(selectedCategory);
        }
        setIsActionsModalOpen(false);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8 relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800" aria-label="Fechar modal"><CloseIcon /></button>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Gerenciar Categorias</h2>
                    
                    <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2">
                        {isLoading ? <Spinner /> : categories.length > 0 ? categories.map(cat => (
                            <div key={cat} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                <span className="font-medium text-slate-700">{cat}</span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => openActionsModal(cat)} 
                                        aria-label={`Ações para ${cat}`} 
                                        className="text-slate-500 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
                                    >
                                        <GearIcon />
                                    </button>
                                </div>
                            </div>
                        )) : <p className="text-slate-500 text-center p-4">Nenhuma categoria cadastrada.</p>}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Adicionar Nova Categoria</h3>
                        <form onSubmit={handleAddCategory} className="flex gap-2">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Nome da categoria"
                                className="flex-grow appearance-none border border-slate-300 bg-white rounded-md py-2 px-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            />
                            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md transition-colors">Adicionar</button>
                        </form>
                        {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
                    </div>
                </div>
            </div>

            {isActionsModalOpen && <CategoryActionsModal 
                isOpen={isActionsModalOpen}
                onClose={() => setIsActionsModalOpen(false)}
                categoryName={selectedCategory}
                onRename={handleRenameFromActions}
                onDelete={handleDeleteFromActions}
            />}
            
            {isRenameModalOpen && categoryToEdit && <RenameCategoryModal 
                isOpen={isRenameModalOpen}
                onClose={() => setIsRenameModalOpen(false)}
                onRename={confirmRenameCategory}
                currentName={categoryToEdit}
                existingCategories={categories}
            />}

            {isConfirmDeleteOpen && categoryToEdit && <ConfirmationModal 
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={confirmDeleteCategory}
                title="Confirmar Exclusão de Categoria"
                message={
                    <p>
                        Tem certeza que deseja excluir a categoria <strong>"{categoryToEdit}"</strong>? <span className="font-bold text-red-600">Todos os produtos desta categoria também serão excluídos permanentemente.</span> Esta ação não pode ser desfeita.
                    </p>
                }
                confirmText="Sim, Excluir Tudo"
            />}
        </>
    );
};

export default CategoryManagementModal;
