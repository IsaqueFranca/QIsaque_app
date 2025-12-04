import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { GraduationCap, AlertCircle, Loader2, CheckCircle2, Sparkles, BrainCircuit, UserX } from 'lucide-react';
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
    
    if (err.code === 'auth/invalid-credential') {
      setError("Senha ou e-mail inválidos.");
    } else if (err.code === 'auth/email-already-in-use') {
      setError("Este e-mail já está cadastrado.");
    } else if (err.code === 'auth/weak-password') {
      setError("A senha deve ter pelo menos 6 caracteres.");
    } else if (err.code === 'auth/unauthorized-domain') {
      setError(`Domínio não autorizado. Adicione este domínio no Firebase Console.`);
    } else if (err.code === 'auth/popup-closed-by-user') {
      setError("Login cancelado.");
    } else {
      setError("Erro: " + (err.message || "Falha na autenticação."));
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
      let result;
      if (isSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      handleAuthSuccess(result.user);
    } catch (err: any) {
      handleAuthError(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Left Side - Hero / Features */}
      <div className="hidden lg:flex flex-1 bg-zinc-900 text-zinc-50 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
           </svg>
        </div>

        <div className="z-10">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                 <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">QIsaque</h1>
           </div>
           
           <h2 className="text-5xl font-extrabold tracking-tight leading-tight mb-6">
             Domine sua residência<br />com inteligência.
           </h2>
           <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
             Planejamento de estudos, cronômetro Pomodoro, inteligência artificial e análises de desempenho sincronizados em todos os seus dispositivos.
           </p>
        </div>

        <div className="space-y-6 z-10">
           {[
             { icon: BrainCircuit, text: "Tutor IA Personalizado" },
             { icon: Sparkles, text: "Sincronização em Nuvem" },
             { icon: CheckCircle2, text: "Método Baseado em Dados" }
           ].map((item, i) => (
             <div key={i} className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                 <item.icon className="w-6 h-6 text-blue-400" />
               </div>
               <span className="font-medium text-lg">{item.text}</span>
             </div>
           ))}
        </div>

        <div className="text-zinc-500 text-sm z-10">
          © {new Date().getFullYear()} QIsaque Planner. Todos os direitos reservados.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
         <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
              <div className="lg:hidden flex justify-center mb-6">
                 <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-8 h-8 text-white" />
                 </div>
              </div>
              <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
                {isSignUp ? 'Comece sua jornada' : 'Bem-vindo de volta'}
              </h2>
              <p className="text-zinc-500 mt-2">
                {isSignUp ? 'Crie sua conta para salvar seu progresso.' : 'Faça login para acessar seu planejamento.'}
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-14 rounded-xl text-base font-medium text-zinc-700 border-zinc-200 hover:bg-zinc-50 relative transition-all hover:border-zinc-300"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continuar com Google
                  </>
                )}
              </Button>

              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200"></div></div>
                <span className="relative bg-zinc-50 lg:bg-white px-3 text-xs text-zinc-400 uppercase tracking-widest font-semibold">Ou com e-mail</span>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                 {error && (
                    <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                    </motion.div>
                 )}

                <div className="space-y-4">
                  <Input 
                      type="email" 
                      placeholder="Seu melhor e-mail" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-14 bg-white border-zinc-200 text-base px-4 rounded-xl"
                  />
                  <Input 
                      type="password" 
                      placeholder="Sua senha secreta" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-14 bg-white border-zinc-200 text-base px-4 rounded-xl"
                  />
                </div>
                <Button type="submit" className="w-full h-14 rounded-xl text-base font-bold bg-zinc-900 hover:bg-zinc-800 shadow-lg shadow-zinc-900/10" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Acessar Plataforma')}
                </Button>
              </form>

              <div className="text-center pt-2 space-y-4">
                <button 
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                    className="text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors block w-full"
                >
                    {isSignUp ? 'Já possui conta? Fazer Login' : 'Não tem uma conta? Cadastre-se'}
                </button>
                
                <div className="relative flex items-center justify-center py-2 opacity-50">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200"></div></div>
                </div>

                <button 
                    type="button"
                    onClick={handleGuestLogin}
                    className="text-sm text-zinc-400 hover:text-zinc-700 font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                   <UserX className="w-4 h-4" />
                   Continuar sem login (Modo Offline)
                </button>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default LoginPage;