import React, { useState } from "react";
import { Settings, HealthDegree } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ArrowLeft, Save } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    onBack();
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
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-lg border-b border-zinc-100 pb-2 text-zinc-900">Perfil & Metas</h3>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-700">Nome de Exibição</label>
            <Input
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              placeholder="Ex: Dr. Isaque"
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
                <option key={d} value={d}>{degreeLabels[d]}</option>
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