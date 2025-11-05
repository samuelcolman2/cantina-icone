import React, { useState, useEffect } from 'react';
import { ref, push, serverTimestamp } from 'firebase/database';
import { db } from '../firebase/config';
import { ProductCategory } from '../types';
import { CloseIcon } from './Icons';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, categories }) => {
  const [productName, setProductName] = useState('');
  const [displayPrice, setDisplayPrice] = useState(''); // Formatted string for display
  const [numericPrice, setNumericPrice] = useState<number | null>(null); // Actual number for DB
  const [productStock, setProductStock] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form state when modal opens
      setProductName('');
      setDisplayPrice('');
      setNumericPrice(null);
      setProductStock('');
      setFeedback(null);
      setIsLoading(false);
      // Set default category if available
      if (categories.length > 0) {
        setSelectedCategory(categories[0]);
      } else {
        setSelectedCategory('');
      }
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (rawValue === '') {
        setDisplayPrice('');
        setNumericPrice(null);
        return;
    }
    const numberValue = parseInt(rawValue, 10) / 100;
    setNumericPrice(numberValue);
    
    const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numberValue);

    setDisplayPrice(formattedValue);
  };
  
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!productName.trim() || numericPrice === null || !productStock || !selectedCategory) {
        setFeedback({ type: 'error', message: 'Por favor, preencha todos os campos.' });
        return;
    }
    if (numericPrice <= 0) {
        setFeedback({ type: 'error', message: 'O preço deve ser maior que zero.' });
        return;
    }
    setIsLoading(true);
    try {
        const productsRef = ref(db, 'products');
        await push(productsRef, {
            name: productName.trim(),
            price: numericPrice,
            stock: parseInt(productStock, 10),
            category: selectedCategory,
            sold: 0,
            image: null,
            createdAt: serverTimestamp(),
        });
        setFeedback({ type: 'success', message: 'Produto criado com sucesso!' });
        setTimeout(() => {
            onClose();
        }, 1500); // Close modal on success
    } catch (error) {
        console.error("Error creating product:", error);
        setFeedback({ type: 'error', message: 'Erro ao criar produto. Tente novamente.' });
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
            
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Criar Novo Produto</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-1" htmlFor="product-name">Nome do Produto</label>
                  <input id="product-name" type="text" value={productName} onChange={(e) => setProductName(e.target.value)} required className="input-style" placeholder="Ex: Coxinha de Frango"/>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-600 text-sm font-medium mb-1" htmlFor="product-price">Preço</label>
                        <input id="product-price" type="text" value={displayPrice} onChange={handlePriceChange} required className="input-style" placeholder="R$ 0,00"/>
                    </div>
                    <div>
                        <label className="block text-slate-600 text-sm font-medium mb-1" htmlFor="product-stock">Estoque Inicial</label>
                        <input id="product-stock" type="number" min="0" step="1" value={productStock} onChange={(e) => setProductStock(e.target.value)} required className="input-style" placeholder="Ex: 50"/>
                    </div>
                </div>

                <div>
                    <label className="block text-slate-600 text-sm font-medium mb-1" htmlFor="product-category">Categoria</label>
                    <select id="product-category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} required className="input-style" disabled={categories.length === 0}>
                    {categories.length === 0 ? (
                        <option>Crie uma categoria primeiro</option>
                    ) : (
                        categories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                    )}
                    </select>
                </div>
              
                {feedback && (
                    <p className={`text-sm p-3 rounded-md border ${feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        {feedback.message}
                    </p>
                )}

                <button type="submit" disabled={isLoading || categories.length === 0} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50">
                    {isLoading ? 'Criando...' : 'Criar Produto'}
                </button>
            </form>
            <style>{`.input-style { appearance: none; border: 1px solid #cbd5e1; background-color: white; border-radius: 0.5rem; width: 100%; padding: 0.5rem 0.75rem; color: #1e293b; line-height: 1.5; } .input-style::placeholder { color: #94a3b8; } .input-style:focus { outline: none; box-shadow: 0 0 0 2px #fb923c; border-color: #f97316; }`}</style>
        </div>
    </div>
  );
};

export default ProductModal;