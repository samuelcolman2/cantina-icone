import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../firebase/config';
import { Product, SaleLogEntry } from '../types';
import { CloseIcon, ChevronLeftIcon } from './Icons';
import Spinner from './Spinner';

interface ProductSalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const ProductSalesReportModal: React.FC<ProductSalesReportModalProps> = ({ isOpen, onClose, product }) => {
  const [logEntries, setLogEntries] = useState<SaleLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'today' | 'history'>('today');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !product) {
      return;
    }

    setIsLoading(true);
    const logRef = ref(db, 'sales_log');
    const productLogQuery = query(logRef, orderByChild('productId'), equalTo(product.id));

    const unsubscribe = onValue(productLogQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entriesArray: SaleLogEntry[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key,
        }));
        setLogEntries(entriesArray.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setLogEntries([]);
      }
      setIsLoading(false);
    }, (error) => {
      console.error(`Error fetching sales log for product ${product.id}:`, error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, product]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFilterType('today');
        setSelectedDate(null);
      }, 300);
    }
  }, [isOpen]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todaySales = useMemo(() => {
    return logEntries.filter(entry => {
      const saleDate = new Date(entry.timestamp);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });
  }, [logEntries, today]);

  const salesByDate = useMemo(() => {
    return logEntries.reduce((acc, entry) => {
      const dateKey = new Date(entry.timestamp).toLocaleDateString('pt-BR', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(entry);
      return acc;
    }, {} as Record<string, SaleLogEntry[]>);
  }, [logEntries]);

  const uniqueDates = useMemo(() => {
    return Object.keys(salesByDate).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('/');
      const [dayB, monthB, yearB] = b.split('/');
      return new Date(`${yearB}-${monthB}-${dayB}`).getTime() - new Date(`${yearA}-${monthA}-${dayA}`).getTime();
    });
  }, [salesByDate]);

  const salesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return salesByDate[selectedDate] || [];
  }, [selectedDate, salesByDate]);

  if (!isOpen || !product) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="h-48"><Spinner /></div>;
    }

    if (filterType === 'today') {
      if (todaySales.length === 0) {
        return <p className="text-center text-slate-500 dark:text-slate-400 p-8">Nenhuma venda registrada hoje para este produto.</p>;
      }
      return (
        <ul className="space-y-3">
          {todaySales.map(entry => (
            <li key={entry.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/40 text-sm">
              <span className="font-medium text-slate-600 dark:text-slate-300">Venda realizada às:</span>
              <span className="text-slate-800 dark:text-slate-100 font-semibold">{formatDate(entry.timestamp)}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (filterType === 'history') {
      if (selectedDate) {
        return (
          <div>
            <button onClick={() => setSelectedDate(null)} className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4 font-semibold">
              <ChevronLeftIcon className="w-4 h-4" />
              Voltar para o histórico
            </button>
            <ul className="space-y-3">
              {salesForSelectedDate.map(entry => (
                <li key={entry.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/40 text-sm">
                  <span className="font-medium text-slate-600 dark:text-slate-300">Venda realizada às:</span>
                  <span className="text-slate-800 dark:text-slate-100 font-semibold">{formatDate(entry.timestamp)}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }

      if (uniqueDates.length === 0) {
        return <p className="text-center text-slate-500 dark:text-slate-400 p-8">Nenhum histórico de vendas para este produto.</p>;
      }

      return (
        <ul className="space-y-3">
          {uniqueDates.map(date => (
            <li key={date}>
              <button onClick={() => setSelectedDate(date)} className="w-full text-left flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">Vendas do dia {date}</span>
                <span className="text-slate-500 dark:text-slate-300 font-semibold bg-slate-200 dark:bg-slate-600 text-xs py-0.5 px-2 rounded-full">{salesByDate[date].length}</span>
              </button>
            </li>
          ))}
        </ul>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8 relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200" aria-label="Fechar modal"><CloseIcon /></button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Relatório de Vendas</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">{product.name.toUpperCase()}</p>

        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex -mb-px">
            <button
              onClick={() => { setFilterType('today'); setSelectedDate(null); }}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${filterType === 'today' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}
            >
              Vendas de Hoje
            </button>
            <button
              onClick={() => { setFilterType('history'); setSelectedDate(null); }}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${filterType === 'history' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}
            >
              Histórico
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 -mr-2 pt-4 min-h-[10rem]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ProductSalesReportModal;