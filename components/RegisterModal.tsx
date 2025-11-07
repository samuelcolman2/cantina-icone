import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { EyeIcon, EyeSlashIcon, CloseIcon } from './Icons';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setIsLoading(false);
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    
    setIsLoading(true);

    try {
      await register(email, password);
      onClose(); // Close modal on successful registration
    } catch (err: any) {
      console.error(err);
      if (err.message === 'Email already in use') {
        setError('Este e-mail já está cadastrado.');
      } else {
        setError('Ocorreu um erro ao criar a conta. Tente novamente.');
      }
    } finally {
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
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          aria-label="Fechar modal"
        >
          <CloseIcon />
        </button>
        
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Criar Conta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="appearance-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md w-full py-2 px-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
          
          <div className="relative">
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1" htmlFor="register-password">
              Senha
            </label>
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="appearance-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md w-full py-2 px-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5 text-slate-500 hover:text-slate-700">
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
          </div>

          <div className="relative">
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1" htmlFor="confirm-password">
              Confirmar Senha
            </label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="appearance-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md w-full py-2 px-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
          
          {error && <p className="text-red-600 text-xs italic text-center">{error}</p>}

          <button
            className="w-full bg-[#FD7F08] hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Criando...' : 'Criar Conta'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;