
import React from 'react';
import { CloseIcon } from './Icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonClass = 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200" aria-label="Fechar modal"><CloseIcon /></button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{title}</h2>
        <div className="text-slate-600 dark:text-slate-300 mb-6">{message}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-md text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`py-2 px-4 rounded-md text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;