import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { EyeIcon, EyeSlashIcon, UserIcon } from './Icons';
import RegisterModal from './RegisterModal';
import ForgotPasswordModal from './ForgotPasswordModal';

interface QuickLoginUser {
  email: string;
  password?: string;
  photoURL: string | null;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickLoginLoading, setIsQuickLoginLoading] = useState(false);
  const [loadingQuickLoginEmail, setLoadingQuickLoginEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [quickLoginUsers, setQuickLoginUsers] = useState<QuickLoginUser[]>([]);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();

  useEffect(() => {
    let users: QuickLoginUser[] = [];
    const savedUsersJson = localStorage.getItem('quickLoginUsers');

    if (savedUsersJson) {
      try {
        const parsed = JSON.parse(savedUsersJson);
        if (Array.isArray(parsed)) {
            users = parsed;
        }
      } catch (e) {
        console.error("Failed to parse quick login users from localStorage", e);
        localStorage.removeItem('quickLoginUsers');
      }
    } else {
      // Fallback for migrating from the old single-user key
      const savedUserJson = localStorage.getItem('quickLoginUser');
      if (savedUserJson) {
        try {
          const oldUser = JSON.parse(savedUserJson);
          // Old format didn't have photoURL, it will be added on the next successful login
          const migratedUser = { email: oldUser.email, password: oldUser.password, photoURL: null };
          users.push(migratedUser);
          localStorage.setItem('quickLoginUsers', JSON.stringify(users));
          localStorage.removeItem('quickLoginUser');
        } catch (e) {
          console.error("Failed to migrate quick login user", e);
          localStorage.removeItem('quickLoginUser');
        }
      }
    }
    setQuickLoginUsers(users);
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
    } catch (err: any) {
      console.error(err);
      setError('E-mail ou senha inválidos.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQuickLoginClick = async (qUser: QuickLoginUser) => {
    if (qUser.password) {
      setError(null);
      setLoadingQuickLoginEmail(qUser.email);
      setIsQuickLoginLoading(true);
      try {
        await login(qUser.email, qUser.password, true);
        // On success, the main App component will re-render due to user state change
      } catch (err: any) {
        // This can happen if the password was changed elsewhere.
        setError('As credenciais salvas são inválidas. Por favor, entre manualmente.');
        const updatedUsers = quickLoginUsers.filter(u => u.email !== qUser.email);
        setQuickLoginUsers(updatedUsers);
        localStorage.setItem('quickLoginUsers', JSON.stringify(updatedUsers));
      } finally {
        setIsQuickLoginLoading(false);
        setLoadingQuickLoginEmail(null);
      }
    } else if (qUser) {
      // Fallback behavior if password isn't stored (e.g., after migration)
      setEmail(qUser.email);
      setRememberMe(true);
      passwordInputRef.current?.focus();
    }
  };
  
  const formatDisplayName = (email: string): string => {
    if (!email) return '';
    const namePart = email.split('@')[0];
    const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    if (capitalized.length > 10) {
      return capitalized.substring(0, 9) + '...';
    }
    return capitalized;
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-[#2d3748] flex flex-col items-center">
        <header className="w-full bg-gray-100 dark:bg-[#2d3748] border-b-4 border-[#FD7F08]">
          <div className="max-w-5xl mx-auto px-4 h-24 flex items-center">
            <div className="flex items-center gap-3">
              <img
                src="https://iconecolegioecurso.com.br/wp-content/uploads/2022/08/xlogo_icone_site.png.pagespeed.ic_.QgXP3GszLC.webp"
                alt="Logo Ícone Colégio e Curso"
                className="h-16 w-auto"
              />
              <span className="w-0.5 h-12 self-center bg-[#FD7F08]" aria-hidden="true"></span>
              <h1 className="font-extrabold tracking-wide text-2xl sm:text-3xl text-[#FD7F08]">
                LOGIN
              </h1>
            </div>
          </div>
        </header>
        
        <main className="flex-grow flex items-center justify-center w-full p-4">
          <div className={`w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-8 md:gap-12 items-center ${quickLoginUsers.length > 0 ? 'justify-around' : 'justify-center'}`}>
            
            {quickLoginUsers.length > 0 && (
              <div className="text-center text-slate-800 dark:text-white order-first md:order-last">
                <h2 className="text-2xl font-bold mb-4">Login rápido</h2>
                <div className="flex flex-wrap justify-center gap-6">
                  {quickLoginUsers.map(qUser => {
                    const isLoadingThisUser = loadingQuickLoginEmail === qUser.email;
                    return (
                      <button
                        key={qUser.email}
                        onClick={() => handleQuickLoginClick(qUser)}
                        disabled={isQuickLoginLoading}
                        className="bg-white dark:bg-[#3a475b] p-6 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-lg hover:border-orange-500 hover:scale-105 transition-all duration-200 group focus:outline-none focus:ring-4 focus:ring-orange-500/50 disabled:opacity-70 disabled:cursor-wait"
                        aria-label={`Logar como ${formatDisplayName(qUser.email)}`}
                      >
                        <div className="relative w-24 h-24 rounded-full mx-auto flex items-center justify-center">
                          {qUser.photoURL ? (
                            <img src={qUser.photoURL} alt={`Foto de ${qUser.email}`} className="w-full h-full rounded-full object-cover border-4 border-slate-300 dark:border-slate-600 group-hover:border-orange-500 transition-colors" />
                          ) : (
                            <div className="w-full h-full bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center border-4 border-slate-300 dark:border-slate-600 group-hover:border-orange-500 transition-colors">
                              <UserIcon className="w-12 h-12 text-slate-400" />
                            </div>
                          )}
                          {isLoadingThisUser && (
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                              <div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-white"></div>
                            </div>
                          )}
                        </div>
                        <p className="mt-4 font-semibold text-lg max-w-[120px] truncate">
                          {isLoadingThisUser ? 'Entrando...' : formatDisplayName(qUser.email)}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            
            <div className={`w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 ${quickLoginUsers.length > 0 ? 'flex-shrink-0' : ''}`}>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Acessar conta</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="appearance-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md w-full py-2 px-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1" htmlFor="password">
                      Senha
                    </label>
                    <input
                      id="password"
                      ref={passwordInputRef}
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

                  <div className="flex items-center justify-between">
                      <div className="flex items-center">
                          <input
                              id="remember-me"
                              name="remember-me"
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="h-4 w-4 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500 rounded cursor-pointer"
                          />
                          <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                              Lembrar de mim
                          </label>
                      </div>

                      <div className="text-sm">
                          <button type="button" onClick={() => setIsForgotPasswordModalOpen(true)} className="font-medium text-blue-600 hover:underline">
                              Esqueceu a senha?
                          </button>
                      </div>
                  </div>
                  
                  {error && <p className="text-red-600 text-xs italic text-center">{error}</p>}

                  <button
                    className="w-full bg-[#FD7F08] hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Aguarde...' : 'Entrar'}
                  </button>
                  
                  <div className="text-center pt-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        Não tem uma conta?
                        <button type="button" onClick={() => setIsRegisterModalOpen(true)} className="font-medium text-blue-600 hover:underline ml-1">
                            Crie uma aqui
                        </button>
                    </span>
                  </div>
                </form>
            </div>

          </div>
        </main>
      </div>
      <RegisterModal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} />
      <ForgotPasswordModal isOpen={isForgotPasswordModalOpen} onClose={() => setIsForgotPasswordModalOpen(false)} />
    </>
  );
};

export default Login;