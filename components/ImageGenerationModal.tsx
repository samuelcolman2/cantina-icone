import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { CloseIcon, SparklesIcon } from './Icons';

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (base64: string) => void;
  productName: string;
}

const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({ isOpen, onClose, onImageGenerated, productName }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageB64, setGeneratedImageB64] = useState<string | null>(null);

  const handleGenerate = async () => {
    let currentPrompt = prompt.trim();
    if (!currentPrompt) {
        // Auto-generate a prompt if empty
        currentPrompt = `Uma foto de alta qualidade de ${productName}, estilo comida, em um prato branco, com um fundo de cantina desfocado.`;
        setPrompt(currentPrompt); // show the user what we are using
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageB64(null);

    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: currentPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: '4:3',
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        setGeneratedImageB64(base64ImageBytes);
      } else {
        throw new Error("A API não retornou uma imagem.");
      }
    } catch (err: any) {
      console.error("Image generation failed", err);
      setError(err.message || "Ocorreu um erro ao gerar a imagem. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUseImage = () => {
    if (generatedImageB64) {
      onImageGenerated(generatedImageB64);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-xl p-8 relative flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          aria-label="Fechar modal"
        >
          <CloseIcon />
        </button>
        
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
            <SparklesIcon className="w-7 h-7 text-orange-500" />
            Gerador de Imagens AI
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Descreva a imagem que você quer criar para "{productName}".</p>

        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Ex: ${productName} em um prato...`}
                    className="flex-grow appearance-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md w-full py-2 px-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
                <button 
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-5 rounded-md shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading ? 'Gerando...' : 'Gerar'}
                </button>
            </div>
            
            <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-600 overflow-hidden relative">
                {isLoading && (
                    <div className="text-center text-slate-600 dark:text-slate-300">
                        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-orange-500 mx-auto"></div>
                        <p className="mt-4 font-semibold">Gerando imagem...</p>
                        <p className="text-sm">Isso pode levar um momento.</p>
                    </div>
                )}
                {error && <div className="text-red-600 p-4 text-center text-sm">{error}</div>}
                
                {generatedImageB64 && !isLoading && (
                    <img 
                        src={`data:image/png;base64,${generatedImageB64}`} 
                        alt={prompt || productName}
                        className="w-full h-full object-cover"
                    />
                )}

                {!generatedImageB64 && !isLoading && !error && (
                    <div className="text-center text-slate-500 dark:text-slate-400 p-4">
                        <p>Sua imagem aparecerá aqui.</p>
                        <p className="text-xs mt-1">Deixe em branco para uma sugestão automática!</p>
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700 mt-6">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-md text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
            >
              Cancelar
            </button>
            <button
              onClick={handleUseImage}
              disabled={!generatedImageB64 || isLoading}
              className="py-2 px-4 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              Usar esta Imagem
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerationModal;