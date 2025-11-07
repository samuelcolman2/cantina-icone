import React, { useState, useEffect, useRef } from 'react';
import { ref, push, serverTimestamp, update } from 'firebase/database';
import { db } from '../firebase/config';
import { ProductCategory, Product } from '../types';
import { CloseIcon, CameraIcon } from './Icons';
import ImageSourceModal from './ImageSourceModal';
import ImageGenerationModal from './ImageGenerationModal';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  productToEdit?: Product | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, categories, productToEdit }) => {
  const [productName, setProductName] = useState('');
  const [displayPrice, setDisplayPrice] = useState('');
  const [numericPrice, setNumericPrice] = useState<number | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isImageSourceModalOpen, setIsImageSourceModalOpen] = useState(false);
  const [isImageGenerationModalOpen, setIsImageGenerationModalOpen] = useState(false);

  const isEditing = !!productToEdit;

  const formatPrice = (value: number | null) => {
    if (value === null) return '';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
  }

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setProductName(productToEdit.name);
        setNumericPrice(productToEdit.price);
        setDisplayPrice(formatPrice(productToEdit.price));
        setPhotoBase64(productToEdit.image || null);
        setSelectedCategory(productToEdit.category);
      } else {
        setProductName('');
        setDisplayPrice('');
        setNumericPrice(null);
        setPhotoBase64(null);
        setSelectedCategory(categories.length > 0 ? categories[0] : '');
      }
      setFeedback(null);
      setIsLoading(false);
      setIsCompressing(false);
    }
  }, [isOpen, productToEdit, categories]);

  const compressImage = (file: File, maxSizeInBytes: number): Promise<string> => {
    const MAX_WIDTH = 1024;
    const MAX_HEIGHT = 1024;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Falha ao ler o arquivo de imagem."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Não foi possível obter o contexto do canvas.'));

                let { width, height } = img;
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                let quality = 0.9;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);

                while (dataUrl.length > maxSizeInBytes && quality > 0.1) {
                    quality -= 0.05;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }
                
                if (dataUrl.length > maxSizeInBytes) {
                   return reject(new Error(`A imagem é muito grande mesmo após compressão. Tente uma menor.`));
                }

                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error("Falha ao carregar a imagem para processamento."));
        };
        reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFeedback(null);
      setIsCompressing(true);

      if (file.size > 10 * 1024 * 1024) { 
          setFeedback({ type: 'error', message: 'A imagem é muito grande. Escolha um arquivo menor que 10MB.' });
          setIsCompressing(false);
          return;
      }

      try {
          const TARGET_SIZE_IN_BYTES = 975 * 1024; // ~975 KB to stay under 1MB
          const compressedBase64 = await compressImage(file, TARGET_SIZE_IN_BYTES);
          setPhotoBase64(compressedBase64);
      } catch (error: any) {
          console.error("Image compression failed", error);
          setFeedback({ type: 'error', message: error.message || 'Erro ao processar a imagem. Tente novamente.' });
      } finally {
          setIsCompressing(false);
      }
  };

  if (!isOpen) return null;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (rawValue === '') {
        setDisplayPrice('');
        setNumericPrice(null);
        return;
    }
    const numberValue = parseInt(rawValue, 10) / 100;
    setNumericPrice(numberValue);
    setDisplayPrice(formatPrice(numberValue));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!productName.trim() || numericPrice === null || !selectedCategory) {
        setFeedback({ type: 'error', message: 'Por favor, preencha todos os campos obrigatórios.' });
        return;
    }
    if (numericPrice <= 0) {
        setFeedback({ type: 'error', message: 'O preço deve ser maior que zero.' });
        return;
    }
    setIsLoading(true);

    const formData = {
        name: productName.trim().toUpperCase(),
        price: numericPrice,
        image: photoBase64,
        category: selectedCategory,
    };

    try {
        if (isEditing) {
            const productRef = ref(db, `products/${productToEdit.id}`);
            await update(productRef, { ...formData, updatedAt: serverTimestamp() });
            setFeedback({ type: 'success', message: 'Produto atualizado com sucesso!' });
        } else {
            const productsRef = ref(db, 'products');
            await push(productsRef, { 
                ...formData,
                stock: 0,
                sold: 0,
                createdAt: serverTimestamp() 
            });
            setFeedback({ type: 'success', message: 'Produto criado com sucesso!' });
        }
        
        setTimeout(() => {
            onClose();
        }, 1500);
    } catch (error) {
        console.error("Error saving product:", error);
        setFeedback({ type: 'error', message: 'Erro ao salvar produto. Tente novamente.' });
        setIsLoading(false);
    }
  };

  const handleChooseImageClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input to allow re-selection of the same file
    }
    setIsImageSourceModalOpen(true);
  };

  const handleSelectUpload = () => {
    setIsImageSourceModalOpen(false);
    fileInputRef.current?.click();
  };

  const handleSelectGenerate = () => {
    setIsImageSourceModalOpen(false);
    setIsImageGenerationModalOpen(true);
  };

  const handleAiImageGenerated = (base64Image: string) => {
    setPhotoBase64(`data:image/png;base64,${base64Image}`);
    setIsImageGenerationModalOpen(false);
  };

  return (
    <>
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
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
                
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">{isEditing ? 'Editar Produto' : 'Criar Novo Produto'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                    <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1" htmlFor="product-name">Nome do Produto</label>
                    <input id="product-name" type="text" value={productName} onChange={(e) => setProductName(e.target.value)} required className="input-style" placeholder="Ex: Coxinha de Frango"/>
                    </div>
                    
                    <div>
                        <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1" htmlFor="product-price">Preço</label>
                        <input id="product-price" type="text" value={displayPrice} onChange={handlePriceChange} required className="input-style" placeholder="R$ 0,00"/>
                    </div>

                    <div>
                        <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Imagem do Produto (Opcional)</label>
                        <div className="mt-1 flex items-center gap-4">
                            <div className="relative w-24 h-24 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                                {photoBase64 ? (
                                    <img src={photoBase64} alt="Prévia do produto" className="w-full h-full object-cover" />
                                ) : (
                                    <CameraIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                                )}
                                {isCompressing && (
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white">
                                        <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-white"></div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/png, image/jpeg, image/webp"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={handleChooseImageClick}
                                    disabled={isCompressing}
                                    className="py-2 px-4 rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                                >
                                    {isCompressing ? 'Processando...' : 'Escolher Imagem'}
                                </button>
                                {photoBase64 && (
                                    <button
                                        type="button"
                                        onClick={() => setPhotoBase64(null)}
                                        className="ml-2 text-sm text-red-600 hover:underline"
                                    >
                                        Remover
                                    </button>
                                )}
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">A imagem será otimizada para &lt;1MB.</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1" htmlFor="product-category">Categoria</label>
                        <select id="product-category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} required className="input-style" disabled={categories.length === 0}>
                        {categories.length === 0 ? (
                            <option>Crie uma categoria primeiro</option>
                        ) : (
                            categories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)
                        )}
                        </select>
                    </div>
                
                    {feedback && (
                        <p className={`text-sm p-3 rounded-md border ${feedback.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'}`}>
                            {feedback.message}
                        </p>
                    )}

                    <button type="submit" disabled={isLoading || categories.length === 0} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50">
                        {isLoading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Produto')}
                    </button>
                </form>
                <style>{`.input-style { appearance: none; border: 1px solid #cbd5e1; background-color: white; border-radius: 0.5rem; width: 100%; padding: 0.5rem 0.75rem; color: #1e293b; line-height: 1.5; } .dark .input-style { border-color: #475569; background-color: #334155; color: #f1f5f9; } .input-style::placeholder { color: #94a3b8; } .input-style:focus { outline: none; box-shadow: 0 0 0 2px #fb923c; border-color: #f97316; }`}</style>
            </div>
        </div>
        
        {isImageSourceModalOpen && (
            <ImageSourceModal
                isOpen={isImageSourceModalOpen}
                onClose={() => setIsImageSourceModalOpen(false)}
                onSelectUpload={handleSelectUpload}
                onSelectGenerate={handleSelectGenerate}
            />
        )}
        {isImageGenerationModalOpen && (
            <ImageGenerationModal
                isOpen={isImageGenerationModalOpen}
                onClose={() => setIsImageGenerationModalOpen(false)}
                onImageGenerated={handleAiImageGenerated}
                productName={productName.toUpperCase() || 'ESTE PRODUTO'}
            />
        )}
    </>
  );
};

export default ProductModal;