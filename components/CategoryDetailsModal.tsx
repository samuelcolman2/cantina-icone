import React, { useMemo } from 'react';
import { Product, ProductCategory } from '../types';
import { CloseIcon } from './Icons';

interface CategoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ProductCategory;
  products: Product[];
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const CategoryDetailsModal: React.FC<CategoryDetailsModalProps> = ({ isOpen, onClose, category, products }) => {
  const categoryProducts = useMemo(() => {
    return products
      .filter(p => p.category === category && p.sold > 0)
      .map(p => ({
        ...p,
        revenue: (p.price || 0) * (p.sold || 0)
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [products, category]);

  const totalRevenue = categoryProducts.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalSold = categoryProducts.reduce((acc, curr) => acc + curr.sold, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[80] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl p-6 sm:p-8 relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
         <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200" aria-label="Fechar modal"><CloseIcon /></button>

         <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Detalhes: {category.toUpperCase()}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Itens que compõem o resultado desta categoria.</p>
            <div className="flex gap-4 sm:gap-8 mt-4 text-sm bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                <div>Total Vendido: <span className="font-bold text-slate-800 dark:text-white">{totalSold} un</span></div>
                <div>Faturamento Total: <span className="font-bold text-slate-800 dark:text-white text-green-600 dark:text-green-400">{BRL.format(totalRevenue)}</span></div>
            </div>
         </div>

         <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            {categoryProducts.length > 0 ? (
                <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-slate-800 font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 z-10">
                        <tr>
                            <th className="pb-3 pl-2">Produto</th>
                            <th className="pb-3 text-center w-20">Qtd.</th>
                            <th className="pb-3 text-right pr-2 w-28">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {categoryProducts.map(product => (
                            <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="py-3 pl-2 font-medium text-slate-800 dark:text-slate-200">{product.name.toUpperCase()}</td>
                                <td className="py-3 text-center text-slate-600 dark:text-slate-400">{product.sold}</td>
                                <td className="py-3 text-right pr-2 text-slate-800 dark:text-slate-200 font-semibold">{BRL.format(product.revenue)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">Nenhuma venda registrada nesta categoria.</p>
            )}
         </div>
      </div>
    </div>
  );
};

export default CategoryDetailsModal;