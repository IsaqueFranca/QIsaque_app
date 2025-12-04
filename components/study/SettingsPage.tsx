
import React, { useState } from "react";
import { Settings, HealthDegree } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ArrowLeft, Save, LogOut, User, UserPlus } from "lucide-react";
import { useStudyStore } from "../../hooks/useStudyStore";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";

interface SettingsPageProps {
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  const [formData, setFormData] = useState(settings);
  const user = useStudyStore(state => state.user);
  const setGuestMode = useStudyStore(state => state.setGuestMode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    onBack();
  };

  const handleLogout = async () => {
      try {
          if (user) {
            await signOut(auth);
          } else {
            setGuestMode(false);
          }
          // The App.tsx watcher will handle the redirect, but calling onBack ensures we don't stay on a stale settings screen
          onBack(); 
      } catch (error) {
          console.error("Logout failed", error);
      }
  };

  const handleGoToLogin = () => {
      setGuestMode(false); // Disable guest mode, which triggers the Login Screen in App.tsx
      // No need to call onBack, App component will render Login Screen immediately
  };

  const degrees: HealthDegree[] = [
    'Medicine', 
    'Pharmacy', 
    'Nursing', 
    'Dentistry', 
    'Physiotherapy', 
    'Biomedicine', 
    'Nutrition', 
    'Clinical Analysis', 
    'Radiology'
  ];

  const degreeLabels: Record<HealthDegree, string> = {
    'Medicine': 'Medicina',
    'Pharmacy': 'Farmácia',
    'Nursing': 'Enfermagem',
    'Dentistry': 'Odontologia',
    'Physiotherapy': 'Fisioterapia',
    'Biomedicine': 'Biomedicina',
    'Nutrition': 'Nutrição',
    'Clinical Analysis': 'Análises Clínicas',
    'Radiology': 'Radiologia'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 md:hidden">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold">Configurações</h2>
      </div>

      <div className="hidden md:block mb-6">
        <h2 className="text-2xl font-bold text-zinc-900">Configurações</h2>
        <p className="text-zinc-500">Personalize sua experiência no QIsaque</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        
        {/* Account Section */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
             <h3 className="font-semibold text-lg border-b border-zinc-100 pb-2 text-zinc-900 flex items-center gap-2">
                 <User className="w-5 h-5 text-zinc-500" />
                 Conta
             </h3>
             {user ? (
                 <div className="flex flex-col gap-3">
                     <div className="flex items-center gap-3">
                         {user.photoURL && <img src={user.photoURL} className="w-10 h-10 rounded-full" />}
                         <div>
                             <p className="font-medium text-zinc-900">{user.displayName || "Usuário"}</p>
                             <p className="text-xs text-zinc-500">{user.email}</p>
                         </div>
                     </div>
                     <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-green-500"></div>
                         Sincronização Ativa
                     </div>
                     <Button type="button" variant="destructive" onClick={handleLogout} className="w-full mt-2">
                         <LogOut className="w-4 h-4 mr-2" />
                         Sair da Conta
                     </Button>
                 </div>
             ) : (
                 <div className="text-center py-4 text-zinc-500 text-sm space-y-3">
                     <div className="bg-orange-50 text-orange-700 p-4 rounded-xl text-left text-xs mb-4">
                        <p className="font-bold mb-1">Modo Visitante Ativo</p>
                        Seus dados estão salvos apenas neste dispositivo. Para não perder seu progresso se trocar de celular ou limpar o cache, faça login.
                     </div>
                     
                     <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleGoToLogin}>
                         <UserPlus className="w-4 h-4 mr-2" />
                         Fazer Login / Criar Conta
                     </Button>
                     
                     <Button type="button" variant="ghost" onClick={handleLogout} className="w-full text-red-400 hover:text-red-500 hover:bg-red-50">
                         Sair do Modo Visitante
                     </Button>
                 </div>
             )}
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-lg border-b border-zinc-100 pb-2 text-zinc-900">Perfil & Metas</h3>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-700">Nome de Exibição</label>
            <Input
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              placeholder="Ex: Isaque"
              className="bg-white"
            />
          </div>
          
           <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-700">Área de Formação</label>
            <select
              className="w-full h-11 px-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-400"
              value={formData.healthDegree || 'Medicine'}
              onChange={(e) => setFormData({ ...formData, healthDegree: e.target.value as HealthDegree })}
            >
              {degrees.map(d => (
                <option key={d} value={d} className="text-zinc-900 bg-white">{degreeLabels[d]}</option>
              ))}
            </select>
            <p className="text-xs text-zinc-500">Isso personaliza o ícone e a ajuda da IA.</p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-700">Meta Final (Aparece no topo)</label>
            <Input
              value={formData.finalGoal || ''}
              onChange={(e) => setFormData({ ...formData, finalGoal: e.target.value })}
              placeholder="Ex: Aprovação na Residência USP"
              className="bg-white"
            />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-lg border-b border-zinc-100 pb-2 text-zinc-900">Estudo e Timer</h3>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-700">Meta Mensal (Horas)</label>
            <Input
              type="number"
              value={formData.monthlyGoalHours}
              onChange={(e) => setFormData({ ...formData, monthlyGoalHours: parseInt(e.target.value) || 0 })}
              className="bg-white"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-700">Duração do Pomodoro (min)</label>
            <Input
              type="number"
              value={formData.pomodoroDuration}
              onChange={(e) => setFormData({ ...formData, pomodoroDuration: parseInt(e.target.value) || 25 })}
              className="bg-white"
            />
          </div>
           <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-700">Pausa Curta (min)</label>
            <Input
              type="number"
              value={formData.shortBreakDuration}
              onChange={(e) => setFormData({ ...formData, shortBreakDuration: parseInt(e.target.value) || 5 })}
              className="bg-white"
            />
          </div>
        </div>

        <Button type="submit" className="w-full md:w-auto" size="lg">
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </form>
    </div>
  );
};

export default SettingsPage;
