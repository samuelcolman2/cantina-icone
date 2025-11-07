import React from 'react';
import { CloseIcon, SparklesIcon, ArrowUpTrayIcon } from './Icons';

interface ImageSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGenerate: () => void;
  onSelectUpload: () => void;
}

const ActionButton: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="w-full text-left p-6 rounded-2xl bg-slate-50 dark:bg-slate-700 hover:bg-orange-500/10 dark:hover:bg-orange-500/10 border-2 border-slate-200 dark:border-slate-600 hover:border-orange-500/30 transition-all duration-200 flex items-center gap-5"
    >
        <div className="bg-orange-100 text-orange-600 rounded-xl p-4 shrink-0">
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{description}</p>
        </div>
    </button>
);

const ImageSourceModal: React.FC<ImageSourceModalProps> = ({ isOpen, onClose, onSelectGenerate, onSelectUpload }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          aria-label="Fechar modal"
        >
          <CloseIcon />
        </button>
        
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Escolher Imagem</h2>
        <div className="space-y-4">
            <ActionButton
                icon={<SparklesIcon className="w-8 h-8" />}
                title="Gerar com IA"
                description="Crie uma imagem única usando inteligência artificial."
                onClick={onSelectGenerate}
            />
            <ActionButton
                icon={<ArrowUpTrayIcon className="w-8 h-8" />}
                title="Fazer Upload"
                description="Envie uma imagem do seu dispositivo."
                onClick={onSelectUpload}
            />
        </div>
      </div>
    </div>
  );
};

export default ImageSourceModal;