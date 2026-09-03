import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Wrench, AlertCircle } from 'lucide-react';
import { loginUser } from '../services/storage';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('arcondicionado.especialista@gmail.com');
  const [password, setPassword] = useState('Ana9825.');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = loginUser(email, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.');
      }
    } catch (err) {
      setErrorMsg('Ocorreu um erro ao realizar login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillCredentials = (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      {/* Decorative background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Header Card */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-xl shadow-sky-500/20 mb-3 border border-sky-300/30">
            <Wrench className="w-8 h-8 drop-shadow-sm" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Vinícius Ar-Condicionado
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Sistema de Gestão Especializada & Ordem de Serviço
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Autenticação</h2>
              <p className="text-xs text-slate-400">Acesse sua conta para gerenciar a oficina</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Acesso Seguro</span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-bold">Falha no Login</p>
                <p className="text-rose-300/90">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                E-mail de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoading ? 'Entrando...' : 'Entrar no Sistema'}</span>
            </button>
          </form>

          {/* Quick Credential Helpers */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 mb-2">Credenciais cadastradas:</p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleFillCredentials('arcondicionado.especialista@gmail.com', 'Ana9825.')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-[11px] transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="font-bold text-sky-400 block">Administrador Geral</span>
                  <span className="text-slate-300 font-mono text-[10px]">arcondicionado.especialista@gmail.com</span>
                </div>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30 group-hover:bg-sky-500/30">
                  Preencher
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* System info */}
        <p className="text-center text-[11px] text-slate-500 mt-5">
          Vinícius Ar-Condicionado Automotivo &copy; {new Date().getFullYear()} &bull; Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};
