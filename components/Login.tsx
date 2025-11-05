import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { EyeIcon, EyeSlashIcon } from './Icons';
import RegisterModal from './RegisterModal';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
    } catch (err: any) {
      console.error(err.code, err.message);
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          setError('E-mail ou senha inválidos.');
          break;
        case 'auth/invalid-email':
          setError('O formato do e-mail é inválido.');
          break;
        default:
          setError('Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#2d3748] flex flex-col items-center">
        <header className="w-full bg-[#2d3748] border-b-4 border-[#FD7F08]">
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
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Login</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-1" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="appearance-none border border-slate-300 bg-white rounded-md w-full py-2 px-3 text-slate-800 placeholder-slate-400 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
                
                <div className="relative">
                  <label className="block text-slate-600 text-sm font-medium mb-1" htmlFor="password">
                    Senha
                  </label>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="appearance-none border border-slate-300 bg-white rounded-md w-full py-2 px-3 text-slate-800 placeholder-slate-400 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 cursor-pointer">
                            Lembrar de mim
                        </label>
                    </div>

                    <div className="text-sm">
                        <a href="#" className="font-medium text-blue-600 hover:underline">
                            Esqueceu a senha?
                        </a>
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
                  <span className="text-sm text-slate-500">
                      Não tem uma conta?
                      <button type="button" onClick={() => setIsRegisterModalOpen(true)} className="font-medium text-blue-600 hover:underline ml-1">
                          Crie uma aqui
                      </button>
                  </span>
                </div>
              </form>
          </div>
        </main>
      </div>
      <RegisterModal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} />
    </>
  );
};

export default Login;