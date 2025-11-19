
import React from 'react';
import { Product, ProductCategory } from '../types';
import { SavoryIcon, SweetIcon, CookieIcon, BoxIcon } from './Icons';
import PieChart from './PieChart';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface ProductRankingProps {
  products: Product[];
  categories: ProductCategory[];
  onCategoryClick?: (category: ProductCategory) => void;
}

const COLORS = ['#0ea5e9', '#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#6b7280']; // sky, blue, orange, green, violet, gray for "Others"

const ProductRanking: React.FC<ProductRankingProps> = ({ products, categories, onCategoryClick }) => {
  const categoryIcons: Record<ProductCategory, React.ReactNode> = {
    Salgados: <SavoryIcon />,
    Doces: <SweetIcon />,
    Biscoitos: <CookieIcon />,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
      {categories.map(category => {
        const productsWithRevenue = products
          .filter(p => p.category === category && p.sold > 0)
          .map(p => ({
            ...p,
            revenue: (p.price || 0) * (p.sold || 0),
          }))
          .sort((a, b) => b.revenue - a.revenue);

        if (productsWithRevenue.length === 0) {
          return (
            <div key={category} className="bg-white dark:bg-[#3a475b] text-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 grid place-items-center bg-orange-100/70 text-[#FD7F08] rounded-lg">
                  {categoryIcons[category] || <BoxIcon />}
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Ranking de {category.toUpperCase()}</h3>
              </div>
              <div className="flex-grow flex items-center justify-center text-center text-slate-500 dark:text-slate-400 p-4 text-sm">
                Nenhuma venda registrada nesta categoria.
              </div>
            </div>
          );
        }

        const totalRevenue = productsWithRevenue.reduce((sum, p) => sum + p.revenue, 0);
        
        const topProducts = productsWithRevenue.slice(0, 4);
        const otherProducts = productsWithRevenue.slice(4);

        const chartDataItems = topProducts.map((p, index) => ({
          label: p.name.toUpperCase(),
          value: p.revenue,
          color: COLORS[index % COLORS.length],
        }));

        if (otherProducts.length > 0) {
          const othersRevenue = otherProducts.reduce((sum, p) => sum + p.revenue, 0);
          chartDataItems.push({
            label: 'Outros',
            value: othersRevenue,
            color: COLORS[COLORS.length - 1],
          });
        }
        
        return (
          <div 
            key={category} 
            onClick={() => onCategoryClick && onCategoryClick(category)}
            className={`bg-white dark:bg-[#3a475b] text-slate-800 dark:text-slate-100 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 flex flex-col ${onCategoryClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200' : ''}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 grid place-items-center bg-orange-100/70 text-[#FD7F08] rounded-lg">
                {categoryIcons[category] || <BoxIcon />}
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Ranking de {category.toUpperCase()}</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-2">
              <div className="flex-shrink-0">
                <PieChart data={chartDataItems.map(d => ({ value: d.value, color: d.color }))} size={160} />
              </div>
              <div className="w-full sm:w-auto flex-1">
                <ul className="space-y-2">
                  {chartDataItems.map(item => (
                    <li key={item.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 dark:text-slate-300 truncate" title={item.label}>{item.label}</span>
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 flex-shrink-0 ml-2">
                        {totalRevenue > 0 ? `${((item.value / totalRevenue) * 100).toFixed(0)}%` : '0%'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductRanking;
