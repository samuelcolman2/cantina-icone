
import React from 'react';
import { Product } from '../types';

interface SaleCardProps {
  product: Product;
  onSell: (product: Product) => void;
  onRequestUnsell: (product: Product) => void;
  dailySold?: number;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function placeholderFor(name?: string): string {
  // Imagem de um salgado apetitoso, simulando uma geração via Gemini (Nano Banana),
  // para ser usada como um placeholder de alta qualidade e personalizado para a cantina.
  // Foto por Raphael Nogueira no Unsplash
  return `https://images.unsplash.com/photo-1627863534539-5519391c12e0?q=80&w=800&auto=format&fit=crop`;
}

const SaleCard: React.FC<SaleCardProps> = ({ product, onSell, onRequestUnsell, dailySold }) => {
  const imageSrc = product.image || placeholderFor(product.name);
  
  // If dailySold is provided, use it. Otherwise fallback to 0 (or product.sold if we wanted total, but requirement is daily)
  const displaySold = dailySold !== undefined ? dailySold : 0;

  return (
    <div className={`bg-white dark:bg-[#3a475b] text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 shadow-md shadow-slate-200/60 dark:shadow-lg dark:shadow-black/20 transition-all duration-200 hover:shadow-lg hover:dark:shadow-black/30 hover:-translate-y-1 ${product.stock === 0 ? 'opacity-60' : ''}`}>
      <div className="w-full aspect-[4/3] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = placeholderFor();
          }}
        />
      </div>

      <div className="flex justify-between items-start mt-3">
        <div className="flex-1">
          <div className="font-semibold text-slate-800 dark:text-white/95">{product.name.toUpperCase()}</div>
          <div className="text-slate-500 dark:text-slate-400 text-sm">Preço: {BRL.format(product.price || 0)}</div>
          <div className="text-slate-500 dark:text-slate-400 text-xs">Estoque: {product.stock}</div>
        </div>
        <div className="text-right">
          <div className="text-slate-500 dark:text-slate-400 text-xs">Vendido Hoje</div>
          <div className="font-bold text-2xl text-slate-800 dark:text-white/95">{displaySold}</div>
        </div>
      </div>
      
      <div className="flex gap-3 mt-3">
        <button
          onClick={() => onRequestUnsell(product)}
          disabled={displaySold <= 0}
          className="w-full text-center py-2.5 px-3 rounded-xl border border-transparent bg-red-500 text-white font-semibold cursor-pointer transition-all duration-200 hover:bg-red-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          Estornar
        </button>
        <button
          onClick={() => onSell(product)}
          disabled={product.stock <= 0}
          className="w-full text-center py-2.5 px-3 rounded-xl border border-transparent bg-orange-500 text-white font-semibold cursor-pointer transition-all duration-200 hover:bg-orange-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          Vender
        </button>
      </div>
    </div>
  );
};

export default SaleCard;
