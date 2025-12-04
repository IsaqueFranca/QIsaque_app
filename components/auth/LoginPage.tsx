import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { GraduationCap, AlertCircle, Loader2 } from 'lucide-react';
import { useStudyStore } from '../../hooks/useStudyStore';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onCancel }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loadFromCloud = useStudyStore(state => state.loadFromCloud);

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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      handleAuthSuccess(result.user);
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com Google');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let result;
      if (isSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      handleAuthSuccess(result.user);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') setError("Senha ou e-mail inválidos.");
      else if (err.code === 'auth/email-already-in-use') setError("Este e-mail já está cadastrado.");
      else if (err.code === 'auth/weak-password') setError("A senha deve ter pelo menos 6 caracteres.");
      else setError("Erro na autenticação. Verifique os dados.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-zinc-100"
      >
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg mb-4">
                <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900">
                {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-zinc-500 text-center mt-2">
                Salve seu progresso na nuvem e nunca perca seus dados.
            </p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 mb-6 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
            </div>
        )}

        <div className="space-y-4">
            <Button 
                type="button" 
                variant="outline" 
                className="w-full h-12 rounded-xl text-zinc-700 border-zinc-200 hover:bg-zinc-50 relative"
                onClick={handleGoogleLogin}
                disabled={loading}
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continuar com Google
                  </>
                )}
            </Button>

            <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100"></div></div>
                <span className="relative bg-white px-3 text-xs text-zinc-400 uppercase tracking-widest">Ou com e-mail</span>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
                <Input 
                    type="email" 
                    placeholder="E-mail" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-zinc-50 border-zinc-200"
                />
                <Input 
                    type="password" 
                    placeholder="Senha" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 bg-zinc-50 border-zinc-200"
                />
                <Button type="submit" className="w-full h-12 rounded-xl" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
                </Button>
            </form>

            <div className="text-center pt-4">
                <button 
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-zinc-500 hover:text-zinc-900 underline"
                >
                    {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar agora'}
                </button>
            </div>
            
             <div className="text-center pt-2">
                <button 
                    type="button"
                    onClick={onCancel}
                    className="text-sm text-zinc-400 hover:text-zinc-600"
                >
                    Continuar sem login (Modo Visitante)
                </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
