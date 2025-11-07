
import React from 'react';
import { Product } from '../types';

interface SaleCardProps {
  product: Product;
  onSell: (product: Product) => void;
  onRequestUnsell: (product: Product) => void;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function placeholderFor(name?: string): string {
  // Imagem de um salgado apetitoso, simulando uma geração via Gemini (Nano Banana),
  // para ser usada como um placeholder de alta qualidade e personalizado para a cantina.
  // Foto por Raphael Nogueira no Unsplash
  return `https://images.unsplash.com/photo-1627863534539-5519391c12e0?q=80&w=800&auto=format&fit=crop`;
}

const SaleCard: React.FC<SaleCardProps> = ({ product, onSell, onRequestUnsell }) => {
  const imageSrc = product.image || placeholderFor(product.name);

  return (
    <div className={`bg-[#3a475b] text-white border border-slate-700 rounded-2xl p-3.5 shadow-lg shadow-black/20 transition-opacity ${product.stock === 0 ? 'opacity-60' : ''}`}>
      <div className="w-full aspect-[4/3] rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
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
          <div className="font-semibold text-white/95">{product.name}</div>
          <div className="text-slate-400 text-sm">Preço: {BRL.format(product.price || 0)}</div>
          <div className="text-slate-400 text-xs">Estoque: {product.stock}</div>
        </div>
        <div className="text-right">
          <div className="text-slate-400 text-xs">Vendido</div>
          <div className="font-bold text-2xl text-white/95">{product.sold || 0}</div>
        </div>
      </div>
      
      <div className="flex gap-3 mt-3">
        <button
          onClick={() => onRequestUnsell(product)}
          disabled={product.sold <= 0}
          className="w-full text-center py-2.5 px-3 rounded-xl border border-red-600 bg-red-600 text-white font-semibold cursor-pointer transition-all duration-200 hover:bg-red-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          Estorno
        </button>
        <button
          onClick={() => onSell(product)}
          disabled={product.stock <= 0}
          className="w-full text-center py-2.5 px-3 rounded-xl border border-green-600 bg-green-600 text-white font-semibold cursor-pointer transition-all duration-200 hover:bg-green-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          ＋ Vendi 1
        </button>
      </div>
    </div>
  );
};

export default SaleCard;