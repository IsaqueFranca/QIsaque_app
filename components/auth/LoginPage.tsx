import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { GraduationCap, AlertCircle, Loader2, UserX, Globe } from 'lucide-react';
import { useStudyStore } from '../../hooks/useStudyStore';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadFromCloud = useStudyStore(state => state.loadFromCloud);
  const setGuestMode = useStudyStore(state => state.setGuestMode);

  const handleAuthSuccess = async (user: any) => {
    setLoading(true);
    try {
        await loadFromCloud(user.uid);
        onLoginSuccess();
    } catch (err) {
        console.error(err);
        setError("Erro ao carregar dados. Tente novamente.");
    } finally {
        setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setGuestMode(true);
  };

  const handleAuthError = (err: any) => {
    console.error("Auth Error:", err);
    setLoading(false);

    if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
      setError("Credenciais inválidas. Verifique email e senha.");
    } else if (err.code === 'auth/email-already-in-use') {
      setError("Este e-mail já está em uso.");
    } else if (err.code === 'auth/weak-password') {
      setError("A senha é muito fraca (min 6 caracteres).");
    } else if (err.code === 'auth/popup-closed-by-user') {
      setError("Login cancelado.");
    } else if (err.code === 'auth/network-request-failed') {
      setError("Erro de conexão. Verifique sua internet.");
    } else if (err.code === 'auth/unauthorized-domain') {
       const domain = window.location.hostname;
       setError(`Domínio não autorizado (${domain}). Adicione este domínio no Firebase Console em Authentication > Settings > Authorized Domains.`);
    } else {
      setError("Ocorreu um erro ao fazer login. Tente novamente.");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      handleAuthSuccess(result.user);
    } catch (err: any) {
      handleAuthError(err);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        handleAuthSuccess(result.user);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        handleAuthSuccess(result.user);
      }
    } catch (err: any) {
      handleAuthError(err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-zinc-900/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">QIsaque</h1>
          <p className="text-zinc-500 mt-2">Planejamento inteligente para sua aprovação.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-xl border border-zinc-100 p-8"
        >
          <div className="flex gap-2 mb-8 bg-zinc-50 p-1.5 rounded-xl">
             <button 
                onClick={() => { setIsSignUp(false); setError(null); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isSignUp ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
             >
                Entrar
             </button>
             <button 
                onClick={() => { setIsSignUp(true); setError(null); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isSignUp ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
             >
                Criar Conta
             </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
             <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Email</label>
                <Input 
                   type="email" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="h-12 bg-zinc-50 border-zinc-200"
                   placeholder="seu@email.com"
                   required
                />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Senha</label>
                <Input 
                   type="password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="h-12 bg-zinc-50 border-zinc-200"
                   placeholder="••••••••"
                   required
                   minLength={6}
                />
             </div>

             <AnimatePresence>
               {error && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start gap-2 overflow-hidden"
                 >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-tight">{error}</span>
                 </motion.div>
               )}
             </AnimatePresence>

             <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold bg-zinc-900 hover:bg-zinc-800"
                disabled={loading}
             >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? "Criar Conta" : "Acessar")}
             </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-400 font-bold tracking-wider">Ou continue com</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
                type="button"
                variant="outline" 
                className="w-full h-12 font-bold border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                onClick={handleGoogleLogin}
                disabled={loading}
            >
                <Globe className="w-4 h-4 mr-2" />
                Google
            </Button>
            
            <Button 
                type="button"
                variant="ghost" 
                className="w-full h-12 font-medium text-zinc-400 hover:text-zinc-600"
                onClick={handleGuestLogin}
            >
                <UserX className="w-4 h-4 mr-2" />
                Continuar como Visitante
            </Button>
          </div>
        </motion.div>

        <p className="text-center text-xs text-zinc-400 mt-8">
          © {new Date().getFullYear()} QIsaque Study Planner
        </p>
      </div>
    </div>
  );
};

export default LoginPage;