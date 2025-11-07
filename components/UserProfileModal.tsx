import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { CloseIcon, CameraIcon, UserIcon } from './Icons';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, updateUserProfile } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && user) {
            // Popula o formulário com os dados atuais do usuário quando o modal é aberto.
            const currentDisplayName = user.displayName;

            // Se o usuário já tiver um nome salvo, exibe-o no campo para edição.
            // Caso contrário, o campo fica vazio para que o placeholder apareça.
            setDisplayName(currentDisplayName || '');

            setPhoto(user.photoURL || null);
            setFeedback(null);
            setIsLoading(false);
            setIsCompressing(false);
        }
    }, [isOpen, user]);

    if (!isOpen || !user) return null;

    const handlePhotoClick = () => {
        if (isCompressing) return;
        fileInputRef.current?.click();
    };

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

                    // Aproxime o tamanho do string base64 iterativamente
                    while (dataUrl.length > maxSizeInBytes && quality > 0.1) {
                        quality -= 0.05;
                        dataUrl = canvas.toDataURL('image/jpeg', quality);
                    }
                    
                    if (dataUrl.length > maxSizeInBytes) {
                       return reject(new Error(`Não foi possível comprimir a imagem o suficiente. Tente uma imagem menor.`));
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
            // Limite do documento do Firestore é 1 MiB (1.048.576 bytes).
            // Vamos mirar em ~975 KB para o string base64 para deixar espaço para outros campos e sobrecarga.
            const FIRESTORE_SAFE_SIZE_IN_BYTES = 975 * 1024;
            const compressedBase64 = await compressImage(file, FIRESTORE_SAFE_SIZE_IN_BYTES);
            setPhoto(compressedBase64);
        } catch (error: any) {
            console.error("Image compression failed", error);
            setFeedback({ type: 'error', message: error.message || 'Erro ao processar a imagem. Tente novamente.' });
        } finally {
            setIsCompressing(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFeedback(null);
        try {
            await updateUserProfile({
                displayName: displayName.trim().toUpperCase(),
                photoBase64: photo,
            });
            setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' });
            setTimeout(onClose, 1500);
        } catch (error) {
            console.error("Failed to update profile", error);
            setFeedback({ type: 'error', message: 'Erro ao atualizar o perfil. Tente novamente.' });
            setIsLoading(false);
        }
    };

    return (
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
            
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">Editar Perfil</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center">
                    <div className="relative">
                        <button type="button" onClick={handlePhotoClick} disabled={isCompressing} className="w-28 h-28 rounded-full focus:outline-none focus:ring-4 focus:ring-orange-500/50 group">
                            {photo ? (
                                <img src={photo} alt="Prévia do perfil" className="w-28 h-28 rounded-full object-cover" />
                            ) : (
                                <UserIcon className="w-28 h-28 text-slate-300 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 rounded-full p-4" />
                            )}
                            <div className={`absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity ${isCompressing ? '!opacity-0' : ''}`}>
                                <CameraIcon className="w-8 h-8" />
                            </div>
                            {isCompressing && (
                                <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center text-white">
                                    <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-white"></div>
                                </div>
                            )}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1" htmlFor="displayName">
                        Nome Completo
                    </label>
                    <input
                        id="displayName"
                        type="text"
                        placeholder="Seu nome completo"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="appearance-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md w-full py-2 px-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                </div>
              
                {feedback && (
                    <p className={`text-sm text-center p-3 rounded-md border ${feedback.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'}`}>
                        {feedback.message}
                    </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2 px-4 rounded-md text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || isCompressing}
                        className="py-2 px-4 rounded-md bg-[#FD7F08] hover:bg-orange-600 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                    >
                        {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
          </div>
        </div>
    );
};

export default UserProfileModal;