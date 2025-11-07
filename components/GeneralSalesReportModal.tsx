import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { CloseIcon, DocumentTextIcon, ChevronRightIcon, SearchIcon } from './Icons';
import ProductSalesReportModal from './ProductSalesReportModal';

interface GeneralSalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

const GeneralSalesReportModal: React.FC<GeneralSalesReportModalProps> = ({ isOpen, onClose, products }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return products;
    return products.filter(p => p.name.toLowerCase().includes(query));
  }, [products, searchQuery]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8 relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200" aria-label="Fechar modal"><CloseIcon /></button>
          
          <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 grid place-items-center bg-orange-100/80 text-orange-600 rounded-lg">
                <DocumentTextIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Relatório Geral de Vendas</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Selecione um produto para ver seu histórico.</p>
              </div>
            </div>
          </div>
          
          <div className="mb-4 relative">
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="appearance-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md w-full py-2 pl-10 pr-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2">
            {filteredProducts.length > 0 ? filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="w-full text-left flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 hover:bg-orange-500/10 dark:hover:bg-orange-500/10 border border-transparent hover:border-orange-500/20 transition-all duration-200 group"
              >
                <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-2">{product.name.toUpperCase()}</span>
                <span className="text-slate-400 group-hover:text-orange-600 transition-colors">
                    <ChevronRightIcon className="w-5 h-5"/>
                </span>
              </button>
            )) : <p className="text-slate-500 dark:text-slate-400 text-center p-8">Nenhum produto encontrado.</p>}
          </div>
        </div>
      </div>

      {selectedProduct && (
        <ProductSalesReportModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
        />
      )}
    </>
  );
};

export default GeneralSalesReportModal;