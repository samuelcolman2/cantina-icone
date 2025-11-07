
import React, { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '../firebase/config';
import { SaleLogEntry } from '../types';
import Spinner from './Spinner';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const SalesLog: React.FC = () => {
    const [logEntries, setLogEntries] = useState<SaleLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const logRef = ref(db, 'sales_log');
        const logQuery = query(logRef, orderByChild('timestamp'), limitToLast(100));
        
        const unsubscribe = onValue(logQuery, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const entriesArray: SaleLogEntry[] = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key,
                }));
                // Firebase returns ascending, so we reverse for descending chronological order
                setLogEntries(entriesArray.reverse());
            } else {
                setLogEntries([]);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching sales log:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <div className="bg-white dark:bg-[#3a475b] text-slate-800 dark:text-slate-100 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 h-[72vh]">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Log de Vendas Recentes</h3>
            <div className="h-[calc(100%-2.5rem)] overflow-y-auto pr-2">
                {isLoading ? <Spinner /> : logEntries.length > 0 ? (
                    <ul className="space-y-3">
                        {logEntries.map(entry => (
                            <li key={entry.id} className="flex flex-col p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/50">
                                <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{entry.productName}</span>
                                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    <span>{BRL.format(entry.price)}</span>
                                    <span>{formatDate(entry.timestamp)}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-slate-500 dark:text-slate-400 p-8 h-full flex items-center justify-center">
                        Nenhuma venda registrada ainda.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesLog;