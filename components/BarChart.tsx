
import React from 'react';
import { ProductCategory } from '../types';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface ChartData {
  revenue: number;
  sold: number;
}

interface BarChartProps {
  data: Record<ProductCategory, ChartData>;
  categories: ProductCategory[];
  onCategoryClick?: (category: ProductCategory) => void;
}

const BarChart: React.FC<BarChartProps> = ({ data, categories, onCategoryClick }) => {
  const revenues = categories.map(cat => data[cat]?.revenue || 0);
  const maxRevenue = Math.max(...revenues);

  if (maxRevenue === 0) {
    return (
      <div className="bg-white dark:bg-[#3a475b] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Faturamento por Categoria</h3>
        <div className="text-center text-slate-500 dark:text-slate-400 p-8 h-64 flex items-center justify-center">
          Nenhuma venda registrada para exibir no gráfico.
        </div>
      </div>
    );
  }

  // Calculate a "nice" upper bound for the Y-axis
  const getScaleMax = (max: number) => {
    if (max <= 0) return 100;
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    const mostSignificantDigit = Math.ceil(max / magnitude);
    return mostSignificantDigit * magnitude;
  };
  
  const yAxisMax = getScaleMax(maxRevenue);
  const numGridLines = 5;
  const yAxisLabels = Array.from({ length: numGridLines + 1 }, (_, i) => {
    return yAxisMax - (i * (yAxisMax / numGridLines));
  });

  // Define a diverse palette of gradients to ensure bars have different colors
  const gradients = [
    'from-blue-500 to-blue-400',      // Blue
    'from-emerald-500 to-emerald-400', // Green
    'from-violet-500 to-violet-400',   // Purple
    'from-pink-500 to-pink-400',       // Pink
    'from-cyan-500 to-cyan-400',       // Cyan
    'from-rose-500 to-rose-400',       // Rose/Red
    'from-amber-500 to-amber-400',     // Amber
    'from-indigo-500 to-indigo-400',   // Indigo
    'from-lime-500 to-lime-400',       // Lime
    'from-fuchsia-500 to-fuchsia-400'  // Fuchsia
  ];

  // Specific overrides to maintain brand/thematic consistency for known categories
  const specificGradients: Record<string, string> = {
    'SALGADOS': 'from-orange-500 to-orange-400',
    'DOCES': 'from-pink-500 to-pink-400',
    'BISCOITOS': 'from-amber-500 to-amber-400',
    'BEBIDAS': 'from-sky-500 to-sky-400',
  };

  const getGradient = (category: string, index: number) => {
    const upperCat = category.toUpperCase();
    if (specificGradients[upperCat]) {
        return specificGradients[upperCat];
    }
    // Use modulus to cycle through gradients for other categories
    return gradients[index % gradients.length];
  };

  return (
    <div className="bg-white dark:bg-[#3a475b] p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Faturamento por Categoria</h3>
      <div className="flex gap-4">
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between h-64 text-right text-xs text-slate-500 dark:text-slate-400 shrink-0">
          {yAxisLabels.map(label => (
            <span key={`label-${label}`}>{BRL.format(label)}</span>
          ))}
        </div>

        {/* Chart Area */}
        <div className="flex-1 flex flex-col">
          <div className="relative h-64">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {yAxisLabels.map((_, index) => (
                <div key={`grid-${index}`} className="w-full border-t border-slate-200/80 dark:border-slate-700/80"></div>
              ))}
            </div>
            
            {/* Bars Container */}
            <div className="absolute inset-0 flex justify-around items-end gap-2 sm:gap-4 text-center px-1 sm:px-2">
              {categories.map((category, index) => {
                const revenue = data[category]?.revenue || 0;
                const height = yAxisMax > 0 ? (revenue / yAxisMax) * 100 : 0;
                const gradientClass = getGradient(category, index);

                return (
                  <div key={category} className="flex flex-col items-center justify-end h-full w-full">
                    <div className="text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm mb-1">{BRL.format(revenue)}</div>
                    <button
                      onClick={() => onCategoryClick && onCategoryClick(category)}
                      className={`w-full rounded-t-lg transition-all duration-500 ease-out bg-gradient-to-t ${gradientClass} ${onCategoryClick ? 'cursor-pointer hover:opacity-90 hover:scale-[1.02]' : ''}`}
                      style={{ height: `${height}%` }}
                      title={`${category.toUpperCase()}: ${BRL.format(revenue)}`}
                      type="button"
                      aria-label={`Ver detalhes de ${category}`}
                    ></button>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Category Labels */}
          <div className="flex justify-around text-center border-t-2 border-slate-200 dark:border-slate-700">
            {categories.map(category => (
              <div key={category} className="w-full text-slate-600 dark:text-slate-300 font-semibold text-xs sm:text-sm pt-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                {category.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarChart;
