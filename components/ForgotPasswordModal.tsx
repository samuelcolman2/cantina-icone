import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { CloseIcon, EyeIcon, EyeSlashIcon } from './Icons';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const { requestPasswordResetCode, confirmPasswordResetWithCode } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail('');
      setCode('');
      setNewPassword('');
      setError(null);
      setNotification(null);
      setSuccess(null);
      setIsLoading(false);
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setNotification(null);

    const result = await requestPasswordResetCode(email);
    if (result.ok) {
      setNotification("Código enviado! Verifique seu e-mail e insira o código abaixo.");
      setStep(2);
    } else {
      setError(result.msg || "Falha ao solicitar o código.");
    }
    setIsLoading(false);
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
        setError("A nova senha deve ter pelo menos 6 caracteres.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setNotification(null);

    const result = await confirmPasswordResetWithCode(email, code, newPassword);
    if (result.ok) {
      setSuccess(result.msg);
      setTimeout(onClose, 3000);
    } else {
      setError(result.msg || "Falha ao redefinir a senha.");
    }
    setIsLoading(false);
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
        
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Redefinir Senha</h2>
        
        {step === 1 && (
          <>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Digite seu e-mail para receber um código de verificação.</p>
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1" htmlFor="reset-email">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-style"
                />
              </div>
              <button className="button-primary" type="submit" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar Código'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
           <>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Insira o código recebido e sua nova senha.</p>
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1" htmlFor="reset-code">
                  Código de Verificação
                </label>
                <input
                  id="reset-code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="input-style"
                />
              </div>
              <div className="relative">
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1" htmlFor="new-password">
                  Nova Senha
                </label>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="input-style"
                />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5 text-slate-500 hover:text-slate-700">
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              <button className="button-primary" type="submit" disabled={isLoading || !!success}>
                {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
              </button>
            </form>
          </>
        )}
        
        {error && <p className="error-message mt-4">{error}</p>}
        {notification && !success && <p className="notification-message mt-4">{notification}</p>}
        {success && <p className="success-message mt-4">{success}</p>}

      </div>
      <style>{`
          .input-style { appearance: none; border: 1px solid #cbd5e1; background-color: white; border-radius: 0.5rem; width: 100%; padding: 0.5rem 0.75rem; color: #1e293b; line-height: 1.5; } 
          .dark .input-style { border-color: #475569; background-color: #334155; color: #f1f5f9; }
          .input-style::placeholder { color: #94a3b8; } 
          .input-style:focus { outline: none; box-shadow: 0 0 0 2px #fb923c; border-color: #f97316; }
          .button-primary { width: 100%; background-color: #FD7F08; color: white; font-weight: bold; padding: 0.5rem 1rem; border-radius: 0.375rem; transition-property: background-color; transition-duration: 200ms; }
          .button-primary:hover { background-color: #ea580c; }
          .button-primary:disabled { opacity: 0.5; }
          .error-message { color: #dc2626; font-size: 0.75rem; font-style: italic; text-align: center; }
          .notification-message { text-align: center; font-size: 0.875rem; padding: 1rem; border-radius: 0.375rem; border-width: 1px; background-color: #eef2ff; border-color: #a5b4fc; color: #3730a3; }
          .dark .notification-message { background-color: #312e81; border-color: #4f46e5; color: #c7d2fe; }
          .success-message { text-align: center; font-size: 0.875rem; padding: 1rem; border-radius: 0.375rem; border-width: 1px; background-color: #f0fdf4; border-color: #bbf7d0; color: #166534; }
          .dark .success-message { background-color: #14532d; border-color: #22c55e; color: #dcfce7; }
      `}</style>
    </div>
  );
};

export default ForgotPasswordModal;