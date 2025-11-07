

import React, { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../firebase/config';
import { Product, ProductCategory } from '../types';
import ProductModal from './ProductModal';
import ProductActionsModal from './ProductActionsModal';
import ConfirmationModal from './ConfirmationModal';
import { GearIcon, CloseIcon } from './Icons';
import Spinner from './Spinner';

interface ProductManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const ProductManagementModal: React.FC<ProductManagementModalProps> = ({ isOpen, onClose }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
    const [selectedProductForActions, setSelectedProductForActions] = useState<Product | null>(null);

    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);


    useEffect(() => {
        if (!isOpen) return;

        setIsLoading(true);

        const productsRef = ref(db, 'products');
        const unsubscribeProducts = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            const productsArray = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
            setProducts(productsArray.sort((a, b) => a.name.localeCompare(b.name)));
            if(isLoading) setIsLoading(false);
        }, (err) => {
            console.error(err);
            setError("Falha ao carregar produtos.");
            setIsLoading(false);
        });

        const categoriesRef = ref(db, 'categories');
        const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
            const data = snapshot.val();
            setCategories(data ? Object.keys(data).sort() : []);
        });

        return () => {
            unsubscribeProducts();
            unsubscribeCategories();
        };
    }, [isOpen]);

    const handleOpenProductModal = (product: Product | null = null) => {
        setEditingProduct(product);
        setIsProductModalOpen(true);
    }
    
    const handleRequestDelete = (product: Product) => {
        setProductToDelete(product);
        setIsConfirmDeleteOpen(true);
    };

    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;
        try {
            await remove(ref(db, `products/${productToDelete.id}`));
        } catch (err) {
            console.error("Error deleting product:", err);
            alert("Ocorreu um erro ao excluir o produto.");
        } finally {
            setProductToDelete(null);
            setIsConfirmDeleteOpen(false);
        }
    };

    const handleOpenActionsModal = (product: Product) => {
        setSelectedProductForActions(product);
        setIsActionsModalOpen(true);
    };

    const handleEditFromActions = () => {
        if (selectedProductForActions) {
            handleOpenProductModal(selectedProductForActions);
        }
        setIsActionsModalOpen(false);
    };

    const handleDeleteFromActions = () => {
        if (selectedProductForActions) {
            handleRequestDelete(selectedProductForActions);
        }
        setIsActionsModalOpen(false);
    };


    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl p-6 sm:p-8 relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200" aria-label="Fechar modal"><CloseIcon /></button>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gerenciar Produtos</h2>
                        <button onClick={() => handleOpenProductModal()} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                            Novo Produto
                        </button>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2">
                        {isLoading ? <Spinner /> : products.length > 0 ? products.map(prod => (
                            <div key={prod.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <div className="truncate pr-2">
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{prod.name.toUpperCase()}</span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{prod.category.toUpperCase()} | Estoque: {prod.stock} | {BRL.format(prod.price)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleOpenActionsModal(prod)} 
                                        aria-label={`Ações para ${prod.name}`} 
                                        className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        <GearIcon />
                                    </button>
                                </div>
                            </div>
                        )) : <p className="text-slate-500 dark:text-slate-400 text-center p-4">Nenhum produto cadastrado.</p>}
                    </div>
                </div>
            </div>

            {isProductModalOpen && <ProductModal 
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                categories={categories}
                productToEdit={editingProduct}
            />}

            {isActionsModalOpen && (
                <ProductActionsModal
                    isOpen={isActionsModalOpen}
                    onClose={() => setIsActionsModalOpen(false)}
                    product={selectedProductForActions}
                    onEdit={handleEditFromActions}
                    onDelete={handleDeleteFromActions}
                />
            )}

            {isConfirmDeleteOpen && productToDelete && (
                <ConfirmationModal
                    isOpen={isConfirmDeleteOpen}
                    onClose={() => setIsConfirmDeleteOpen(false)}
                    onConfirm={confirmDeleteProduct}
                    title="Confirmar Exclusão de Produto"
                    message={
                        <p>
                            Tem certeza que deseja excluir o produto <strong>"{productToDelete.name.toUpperCase()}"</strong>? Esta ação não pode ser desfeita.
                        </p>
                    }
                    confirmText="Sim, Excluir"
                />
            )}
        </>
    );
};

export default ProductManagementModal;