
import React from 'react';
import { Product } from '../types';

interface SaleCardProps {
  product: Product;
  onSell: (id: string) => void;
  onUnsell: (id: string) => void;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function placeholderFor(name: string = "Salgado"): string {
  const text = encodeURIComponent(name);
  return `https://placehold.co/600x450/f1f5f9/64748b/png?text=${text}`;
}

const SaleCard: React.FC<SaleCardProps> = ({ product, onSell, onUnsell }) => {
  const imageSrc = product.image || placeholderFor(product.name);

  return (
    <div className={`bg-white text-slate-800 border border-slate-200 rounded-2xl p-3.5 shadow-sm transition-opacity ${product.stock === 0 ? 'opacity-60' : ''}`}>
      <img
        src={imageSrc}
        alt={product.name}
        loading="lazy"
        className="w-full aspect-4/3 object-cover rounded-xl border border-slate-200 bg-slate-50 block"
        onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = placeholderFor(product.name);
        }}
      />

      <div className="flex justify-between items-start mt-3">
        <div className="flex-1">
          <div className="font-semibold text-slate-800">{product.name}</div>
          <div className="text-slate-500 text-sm">Preço: {BRL.format(product.price || 0)}</div>
          <div className="text-slate-500 text-xs">Estoque: {product.stock}</div>
        </div>
        <div className="text-right">
          <div className="text-slate-500 text-xs">Vendido</div>
          <div className="font-bold text-2xl text-slate-800">{product.sold || 0}</div>
        </div>
      </div>
      
      <div className="flex gap-3 mt-3">
        <button
          onClick={() => onUnsell(product.id)}
          disabled={product.sold <= 0}
          className="w-full text-center py-2.5 px-3 rounded-xl border border-red-600 bg-red-600 text-white cursor-pointer transition-all duration-200 hover:bg-red-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          – Diminuir
        </button>
        <button
          onClick={() => onSell(product.id)}
          disabled={product.stock <= 0}
          className="w-full text-center py-2.5 px-3 rounded-xl border border-green-600 bg-green-600 text-white cursor-pointer transition-all duration-200 hover:bg-green-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          ＋ Vendi 1
        </button>
      </div>
    </div>
  );
};

export default SaleCard;
