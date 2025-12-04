import React, { useState, useMemo } from "react";
import { Month } from "../../types";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Check, X, FileText, AlertCircle, ArrowRight, Sparkles, Loader2, Wand2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { useStudyStore } from "../../hooks/useStudyStore";
import { cn, getMonthIndex, generateId } from "../../lib/utils";
import { organizeSubjectsFromText } from "../../services/geminiService";

interface MonthGridProps {
  months: Month[];
  onSelectMonth: (monthId: string) => void;
}

// Helper interface for the AI Draft List
interface DraftSubject {
  id: string;
  name: string;
}

const MonthGrid: React.FC<MonthGridProps> = ({ months, onSelectMonth }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newMonthName, setNewMonthName] = useState("");
  const [newMonthYear, setNewMonthYear] = useState(new Date().getFullYear());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // AI Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedExamForAi, setSelectedExamForAi] = useState<Month | null>(null);
  const [aiInputText, setAiInputText] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiDraftSubjects, setAiDraftSubjects] = useState<DraftSubject[]>([]);
  const [aiStep, setAiStep] = useState<'input' | 'review'>('input');
  const [manualDraftInput, setManualDraftInput] = useState("");

  const { addMonth, editMonth, deleteMonth, getSubjectsByMonthId, addSubject } = useStudyStore();

  const handleAddMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMonthName.trim()) {
      addMonth(newMonthName, newMonthYear);
      setNewMonthName("");
      setIsAdding(false);
    }
  };

  const handleEdit = (month: Month) => {
    setEditingId(month.id);
    setEditName(month.name);
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      editMonth(id, editName);
    }
    setEditingId(null);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMonth(deleteId);
      setDeleteId(null);
    }
  };

  // AI Logic
  const openAiModal = (month: Month) => {
    setSelectedExamForAi(month);
    setAiInputText("");
    setAiDraftSubjects([]);
    setAiStep('input');
    setAiModalOpen(true);
  };

  const handleAiOrganize = async () => {
    if (!aiInputText.trim()) return;
    setIsAiProcessing(true);
    try {
      const subjects = await organizeSubjectsFromText(aiInputText);
      const drafts = subjects.map(s => ({ id: generateId(), name: s }));
      setAiDraftSubjects(drafts);
      setAiStep('review');
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const updateDraftSubject = (id: string, newName: string) => {
    setAiDraftSubjects(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const removeDraftSubject = (id: string) => {
    setAiDraftSubjects(prev => prev.filter(s => s.id !== id));
  };

  const addManualDraftSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualDraftInput.trim()) {
      setAiDraftSubjects(prev => [...prev, { id: generateId(), name: manualDraftInput }]);
      setManualDraftInput("");
    }
  };

  const confirmImportSubjects = () => {
    if (selectedExamForAi && aiDraftSubjects.length > 0) {
      aiDraftSubjects.forEach(sub => {
        addSubject(sub.name, selectedExamForAi.id);
      });
      setAiModalOpen(false);
    }
  };

  const getMonthProgress = (monthId: string) => {
    const subjects = getSubjectsByMonthId(monthId);
    if (subjects.length === 0) return 0;
    
    let totalSubtopics = 0;
    let completedSubtopics = 0;
    
    subjects.forEach(s => {
      totalSubtopics += s.subtopics.length;
      completedSubtopics += s.subtopics.filter(st => st.isCompleted).length;
    });

    if (totalSubtopics === 0) return 0;
    return Math.round((completedSubtopics / totalSubtopics) * 100);
  };

  const sortedMonths = useMemo(() => {
    return [...months].sort((a, b) => {
      // 1. Compare Year Descending
      const yearA = a.year || 0;
      const yearB = b.year || 0;
      if (yearA !== yearB) return yearB - yearA;

      // 2. Keep created order or alphabetical if needed
      return 0;
    });
  }, [months]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-2xl font-bold tracking-tight text-zinc-900">Minhas Provas</h3>
           <p className="text-zinc-500 text-sm">Gerencie seus exames e cronogramas de estudo.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant="default" className="rounded-full px-6">
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? "Cancelar" : "Nova Prova"}
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAddMonth}
            className="flex flex-col md:flex-row gap-3 mb-8 overflow-hidden bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm"
          >
            <Input
              value={newMonthName}
              onChange={(e) => setNewMonthName(e.target.value)}
              placeholder="Ex: Residência USP 2025"
              className="flex-[2] bg-white h-12 text-lg px-4 border-zinc-200"
              autoFocus
            />
             <Input
              type="number"
              value={newMonthYear}
              onChange={(e) => setNewMonthYear(parseInt(e.target.value))}
              placeholder="Ano"
              className="flex-1 bg-white h-12 text-lg px-4 border-zinc-200"
            />
            <Button type="submit" size="lg" className="rounded-xl h-12 px-8">Salvar</Button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedMonths.map((month) => {
          const progress = getMonthProgress(month.id);
          const isEditing = editingId === month.id;
          
          return (
            <motion.div
              key={month.id}
              whileHover={!isEditing ? { y: -4, scale: 1.01 } : {}}
              className={cn(
                "group relative border border-zinc-100 bg-white rounded-[2rem] p-6 transition-all duration-300",
                "hover:shadow-2xl hover:shadow-zinc-200/50 hover:border-zinc-200"
              )}
            >
              <div className="flex justify-between items-start mb-8 h-10">
                {isEditing ? (
                  <div className="flex gap-2 w-full">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-9"
                    />
                    <Button size="icon" variant="default" className="h-9 w-9 rounded-full shrink-0" onClick={() => saveEdit(month.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                     <div className="flex items-center gap-3">
                        <div 
                            className="w-10 h-10 rounded-full bg-zinc-900 text-zinc-50 flex items-center justify-center shadow-lg shadow-zinc-500/10 group-hover:scale-110 transition-transform duration-300"
                        >
                            <FileText className="w-5 h-5" />
                        </div>
                        {month.year && (
                           <span className="text-sm font-semibold text-zinc-400 bg-zinc-50 px-2 py-1 rounded-md">
                             {month.year}
                           </span>
                        )}
                     </div>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700"
                          onClick={(e) => { e.stopPropagation(); openAiModal(month); }}
                          title="Importar via IA"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-zinc-100"
                          onClick={(e) => { e.stopPropagation(); handleEdit(month); }}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(month.id); }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" />
                        </Button>
                      </div>
                  </>
                )}
              </div>

              <div 
                className="cursor-pointer space-y-4" 
                onClick={() => !isEditing && onSelectMonth(month.id)}
              >
                <div>
                   <h4 className="font-bold text-xl text-zinc-900 group-hover:text-black transition-colors truncate pr-2" title={month.name}>{month.name}</h4>
                   <p className="text-zinc-500 text-sm mt-1 flex items-center gap-2 group-hover:gap-3 transition-all">
                      {getSubjectsByMonthId(month.id).length} matérias
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </p>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                    <span>Progresso</span>
                    <span className="text-zinc-900">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1 bg-zinc-100" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {sortedMonths.length === 0 && !isAdding && (
         <div className="text-center py-20">
           <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <FileText className="w-8 h-8 text-zinc-300" />
           </div>
           <h3 className="text-lg font-semibold text-zinc-900">Comece sua jornada</h3>
           <p className="text-zinc-500 max-w-xs mx-auto mt-2 mb-6">Crie sua primeira prova para organizar o conteúdo programático.</p>
           <Button onClick={() => setIsAdding(true)} variant="default" size="lg" className="rounded-full">Criar Prova</Button>
         </div>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
            onClick={() => setDeleteId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-zinc-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                 <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-bold text-xl text-zinc-900 mb-2">Excluir Prova?</h3>
              <p className="text-zinc-500 leading-relaxed mb-8">
                Esta ação é irreversível. Todos os assuntos e progresso desta prova serão apagados.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12" onClick={() => setDeleteId(null)}>Voltar</Button>
                <Button variant="destructive" className="h-12" onClick={confirmDelete}>Confirmar</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Subject Import Modal */}
      <AnimatePresence>
        {aiModalOpen && selectedExamForAi && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
            onClick={() => setAiModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-zinc-100 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-zinc-900">Organizador Inteligente</h3>
                  <p className="text-xs text-zinc-500">
                    Importando para: <span className="font-medium text-indigo-600">{selectedExamForAi.name}</span>
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setAiModalOpen(false)} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              {aiStep === 'input' ? (
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                  <p className="text-sm text-zinc-600">
                    Cole abaixo a lista de assuntos do seu edital, ementa ou anotações. A IA vai identificar, separar e organizar os tópicos automaticamente para você.
                  </p>
                  <textarea 
                    className="flex-1 min-h-[200px] w-full p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
                    placeholder="Ex: Cardiologia, Pneumologia, Nefrologia... ou cole um texto longo do edital."
                    value={aiInputText}
                    onChange={(e) => setAiInputText(e.target.value)}
                  />
                  <div className="flex justify-end gap-3 mt-2">
                     <Button variant="ghost" onClick={() => setAiModalOpen(false)}>Cancelar</Button>
                     <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
                      onClick={handleAiOrganize}
                      disabled={isAiProcessing || !aiInputText.trim()}
                     >
                        {isAiProcessing ? (
                          <>
                             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                             Processando...
                          </>
                        ) : (
                          <>
                             <Wand2 className="w-4 h-4 mr-2" />
                             Organizar com IA
                          </>
                        )}
                     </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <p className="text-sm font-medium text-zinc-700">
                      Revisar Matérias ({aiDraftSubjects.length})
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setAiStep('input')} className="text-zinc-400 hover:text-zinc-600 h-8 text-xs">
                      Voltar e editar texto
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-zinc-50 rounded-xl border border-zinc-100 p-2 space-y-2 mb-4">
                    {aiDraftSubjects.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                         <FileText className="w-8 h-8 mb-2 opacity-20" />
                         <p className="text-sm">Nenhum assunto encontrado.</p>
                      </div>
                    ) : (
                      aiDraftSubjects.map((subject) => (
                        <div key={subject.id} className="group flex items-center gap-2 bg-white p-2 rounded-lg border border-zinc-200 shadow-sm transition-all hover:border-indigo-200">
                          <div className="w-1 h-8 bg-indigo-500 rounded-full shrink-0"></div>
                          <input 
                             value={subject.name}
                             onChange={(e) => updateDraftSubject(subject.id, e.target.value)}
                             className="flex-1 bg-transparent text-sm text-zinc-800 font-medium focus:outline-none"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-zinc-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={() => removeDraftSubject(subject.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={addManualDraftSubject} className="flex gap-2 shrink-0 mb-4">
                     <Input 
                       value={manualDraftInput}
                       onChange={(e) => setManualDraftInput(e.target.value)}
                       placeholder="Adicionar assunto manualmente..."
                       className="bg-white"
                     />
                     <Button type="submit" variant="secondary" disabled={!manualDraftInput.trim()}>
                       <Plus className="w-4 h-4" />
                     </Button>
                  </form>

                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 shrink-0">
                    <Button variant="outline" onClick={() => setAiModalOpen(false)}>Descartar</Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto" onClick={confirmImportSubjects}>
                       <Check className="w-4 h-4 mr-2" />
                       Salvar {aiDraftSubjects.length} Matérias
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthGrid;