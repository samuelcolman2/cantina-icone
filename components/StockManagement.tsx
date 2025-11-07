import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase/config';
import { Product } from '../types';
import Spinner from './Spinner';
import { DocumentTextIcon } from './Icons';
import GeneralSalesReportModal from './GeneralSalesReportModal';

const StockManagement: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
    const [feedback, setFeedback] = useState<Record<string, { message: string; type: 'info' | 'success' | 'error' }>>({});
    const [isGeneralReportModalOpen, setIsGeneralReportModalOpen] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        const productsRef = ref(db, 'products');
        const unsubscribe = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            const productsArray: Product[] = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
            setProducts(productsArray.sort((a, b) => a.name.localeCompare(b.name)));
            
            const initialInputs: Record<string, string> = {};
            productsArray.forEach(p => {
                initialInputs[p.id] = String(p.stock || 0);
            });
            setStockInputs(initialInputs);
            
            setIsLoading(false);
        }, (error) => {
            console.error(error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleInputChange = (productId: string, value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        setStockInputs(prev => ({
            ...prev,
            [productId]: numericValue
        }));
    };

    const handleUpdateStock = async (productId: string) => {
        const newStock = parseInt(stockInputs[productId], 10);
        if (isNaN(newStock) || newStock < 0) {
            setFeedback(prev => ({ ...prev, [productId]: { message: "Inválido", type: 'error' } }));
            return;
        }

        setFeedback(prev => ({ ...prev, [productId]: { message: "Salvando...", type: 'info' } }));
        try {
            const productRef = ref(db, `products/${productId}`);
            await update(productRef, { stock: newStock });
            setFeedback(prev => ({ ...prev, [productId]: { message: "Salvo!", type: 'success' } }));
            setTimeout(() => setFeedback(prev => {
                const newFeedback = { ...prev };
                delete newFeedback[productId];
                return newFeedback;
            }), 2000);
        } catch (error) {
            console.error("Error updating stock:", error);
            setFeedback(prev => ({ ...prev, [productId]: { message: "Erro!", type: 'error' } }));
        }
    };

    return (
        <>
            <div className="bg-white text-slate-800 rounded-2xl shadow-lg border border-slate-200/50 p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                    <p className="text-slate-500 max-w-md">
                        Atualize a quantidade de itens disponíveis para venda.
                    </p>
                    <button
                        onClick={() => setIsGeneralReportModalOpen(true)}
                        className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-all duration-200 border border-slate-300/80 shadow-sm hover:shadow-md flex items-center gap-2 text-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                        <DocumentTextIcon className="w-5 h-5 text-slate-500" />
                        Relatório Geral
                    </button>
                </div>
                {isLoading ? <Spinner /> : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="max-h-[65vh] overflow-y-auto relative">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50 sticky top-0 z-10">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">
                                            Produto
                                        </th>
                                        <th scope="col" className="hidden sm:table-cell px-3 py-3.5 text-center text-sm font-semibold text-slate-900">
                                            Estoque Atual
                                        </th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-sm font-semibold text-slate-900 text-center">
                                            Ajustar Estoque
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {products.map(product => {
                                        const feedbackState = feedback[product.id];
                                        const isSaving = feedbackState?.type === 'info';
                                        const isSuccess = feedbackState?.type === 'success';

                                        let buttonClass = "bg-blue-600 hover:bg-blue-700";
                                        if (isSuccess) buttonClass = "bg-green-600";
                                        if (isSaving) buttonClass = "bg-slate-400 cursor-wait";
                                        
                                        return (
                                            <tr key={product.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">
                                                    {product.name}
                                                </td>
                                                <td className="hidden sm:table-cell whitespace-nowrap px-3 py-4 text-sm text-slate-500 text-center">
                                                    {product.stock}
                                                </td>
                                                <td className="whitespace-nowrap py-4 pl-3 pr-4 text-sm font-medium sm:pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <input
                                                            id={`stock-${product.id}`}
                                                            type="number"
                                                            value={stockInputs[product.id] || ''}
                                                            onChange={(e) => handleInputChange(product.id, e.target.value)}
                                                            className="appearance-none border border-slate-300 bg-white rounded-md w-24 py-1.5 px-2 text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateStock(product.id)}
                                                            disabled={isSaving || isSuccess}
                                                            className={`text-white font-semibold py-1.5 px-4 rounded-md transition-colors text-sm w-28 text-center disabled:cursor-not-allowed ${buttonClass}`}
                                                        >
                                                            {feedbackState?.message || 'Salvar'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                             {products.length === 0 && (
                                <div className="text-center text-slate-500 p-8">
                                    Nenhum produto cadastrado para gerenciar o estoque.
                                </div>
                            )}
                        </div>
                    </div>
                )}
                 <style>{`
                    /* Hide spin buttons on number inputs */
                    input[type=number]::-webkit-inner-spin-button, 
                    input[type=number]::-webkit-outer-spin-button { 
                      -webkit-appearance: none; 
                      margin: 0; 
                    }
                    input[type=number] {
                      -moz-appearance: textfield;
                    }
                `}</style>
            </div>

            {isGeneralReportModalOpen && (
                <GeneralSalesReportModal
                    isOpen={isGeneralReportModalOpen}
                    onClose={() => setIsGeneralReportModalOpen(false)}
                    products={products} />
            )}
        </>
    );
};

export default StockManagement;