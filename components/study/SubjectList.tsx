
import React, { useState } from "react";
import { Subject } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { ArrowLeft, Plus, Trash2, Check, ChevronDown, ChevronRight, Wand2, Loader2, BookOpen, Target, Tag as TagIcon, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateSubtopicsForSubject } from "../../services/geminiService";
import { useStudyStore } from "../../hooks/useStudyStore";
import { cn } from "../../lib/utils";

interface SubjectListProps {
  monthId: string;
  subjects: Subject[];
  onBack: () => void;
}

const SubjectList: React.FC<SubjectListProps> = ({
  monthId,
  subjects,
  onBack,
}) => {
  const { 
    addSubject, 
    deleteSubject, 
    addSubtopic, 
    toggleSubtopic, 
    deleteSubtopic, 
    importSubtopics,
    getSubjectProgress
  } = useStudyStore();

  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectTitle, setNewSubjectTitle] = useState("");
  const [newSubjectTag, setNewSubjectTag] = useState("");
  const [newSubjectGoal, setNewSubjectGoal] = useState("");
  
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [newSubtopic, setNewSubtopic] = useState("");
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Delete confirmation
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjectTitle.trim()) {
      addSubject(
        newSubjectTitle, 
        monthId, 
        newSubjectTag.trim() || undefined, 
        newSubjectGoal ? parseInt(newSubjectGoal) : undefined
      );
      setNewSubjectTitle("");
      setNewSubjectTag("");
      setNewSubjectGoal("");
      setIsAddingSubject(false);
    }
  };

  const handleAddSubtopic = (e: React.FormEvent, subjectId: string) => {
    e.preventDefault();
    if (newSubtopic.trim()) {
      addSubtopic(subjectId, newSubtopic);
      setNewSubtopic("");
    }
  };

  const handleGenerateSubtopics = async (subject: Subject) => {
    setIsGenerating(subject.id);
    try {
      const generatedTopics = await generateSubtopicsForSubject(subject.title);
      if (generatedTopics.length > 0) {
        importSubtopics(subject.id, generatedTopics);
        setExpandedSubject(subject.id);
      }
    } catch (error) {
      console.error("Error generating topics", error);
    } finally {
      setIsGenerating(null);
    }
  };

  const confirmDelete = () => {
    if (deleteSubjectId) {
      deleteSubject(deleteSubjectId);
      setDeleteSubjectId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold text-zinc-900">Assuntos do Mês</h2>
      </div>

      {!isAddingSubject ? (
        <Button onClick={() => setIsAddingSubject(true)} className="w-full border-dashed bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50" variant="outline">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Assunto
        </Button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm"
        >
          <form onSubmit={handleAddSubject} className="space-y-3">
             <div className="grid gap-1">
               <label className="text-xs font-medium text-zinc-500">Nome do Assunto</label>
               <Input
                  value={newSubjectTitle}
                  onChange={(e) => setNewSubjectTitle(e.target.value)}
                  placeholder="Ex: Pneumonia Adquirida na Comunidade, SEPSE..."
                  autoFocus
                  className="bg-white"
                />
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-zinc-500">Tag (Opcional)</label>
                  <Input
                      value={newSubjectTag}
                      onChange={(e) => setNewSubjectTag(e.target.value)}
                      placeholder="Ex: Alta Prioridade"
                      className="bg-white"
                    />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-zinc-500">Meta Semanal (horas)</label>
                  <Input
                      type="number"
                      value={newSubjectGoal}
                      onChange={(e) => setNewSubjectGoal(e.target.value)}
                      placeholder="Ex: 5"
                      className="bg-white"
                    />
                </div>
             </div>
             <div className="flex gap-2 pt-2">
               <Button type="submit" className="flex-1">Salvar</Button>
               <Button type="button" variant="ghost" onClick={() => setIsAddingSubject(false)}>Cancelar</Button>
             </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-3">
        {subjects.length === 0 && !isAddingSubject && (
          <div className="text-center py-10 text-zinc-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum assunto adicionado para este mês.</p>
          </div>
        )}

        <AnimatePresence>
          {subjects.map((subject) => {
             const progress = getSubjectProgress(subject.id);

             return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-zinc-100 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div 
                className="flex flex-col p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {expandedSubject === subject.id ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                    <div>
                      <h3 className="font-semibold text-zinc-900">{subject.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {subject.tag && (
                          <span className="inline-flex items-center text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                            <TagIcon className="w-3 h-3 mr-1" />
                            {subject.tag}
                          </span>
                        )}
                         {subject.weeklyGoal && (
                          <span className="inline-flex items-center text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium">
                            <Target className="w-3 h-3 mr-1" />
                            Meta: {subject.weeklyGoal}h
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                     <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateSubtopics(subject);
                      }}
                      disabled={isGenerating === subject.id}
                      title="Gerar Subtópicos com IA"
                    >
                      {isGenerating === subject.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-500 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteSubjectId(subject.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                   <Progress value={progress} className="h-1.5 flex-1 bg-zinc-100" />
                   <span className="text-xs text-zinc-400 w-8 text-right">{progress}%</span>
                </div>
              </div>

              {expandedSubject === subject.id && (
                <div className="bg-zinc-50/50 p-4 pt-0 border-t border-zinc-100">
                  <div className="space-y-1 mt-4">
                    {subject.subtopics.map((subtopic) => (
                      <div key={subtopic.id} className="flex items-center gap-3 group py-1">
                         <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={subtopic.isCompleted}
                              onChange={() => toggleSubtopic(subject.id, subtopic.id)}
                              className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-zinc-300 transition-all checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-400"
                            />
                             <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" />
                         </div>
                       
                        <span className={cn(
                          "flex-1 text-sm transition-all text-zinc-700",
                          subtopic.isCompleted && "text-zinc-400 line-through"
                        )}>
                          {subtopic.title}
                        </span>
                        <button
                          onClick={() => deleteSubtopic(subject.id, subtopic.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    <form onSubmit={(e) => handleAddSubtopic(e, subject.id)} className="flex gap-2 mt-4 pt-2">
                      <Input
                        value={newSubtopic}
                        onChange={(e) => setNewSubtopic(e.target.value)}
                        placeholder="Ex: Fisiopatologia, Critérios Diagnósticos..."
                        className="h-9 text-sm bg-white"
                      />
                      <Button type="submit" size="sm" variant="secondary" className="bg-white border border-zinc-200">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          );
          })}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteSubjectId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDeleteSubjectId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4 text-red-600">
                <AlertCircle className="w-6 h-6" />
                <h3 className="font-semibold text-lg">Excluir Assunto?</h3>
              </div>
              <p className="text-zinc-500 mb-6">
                Tem certeza que deseja excluir este assunto e seus subtópicos? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteSubjectId(null)}>Cancelar</Button>
                <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubjectList;