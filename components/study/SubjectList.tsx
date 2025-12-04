
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
    getSubjectProgress,
    settings
  } = useStudyStore();

  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [newSubtopics, setNewSubtopics] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  
  // New Subject Input State
  const [newSubjectName, setNewSubjectName] = useState("");

  // Delete confirmation
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);

  // Initialize expanded state: open all by default for better visibility of subtopics inputs
  React.useEffect(() => {
     if (subjects.length > 0) {
         setExpandedSubjects(subjects.map(s => s.id));
     }
  }, [subjects.length]); 

  const toggleExpand = (id: string) => {
    setExpandedSubjects(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjectName.trim()) {
      addSubject(newSubjectName, monthId);
      setNewSubjectName("");
    }
  };

  const handleAddSubtopic = (e: React.FormEvent, subjectId: string) => {
    e.preventDefault();
    const title = newSubtopics[subjectId];
    if (title && title.trim()) {
      addSubtopic(subjectId, title);
      setNewSubtopics(prev => ({ ...prev, [subjectId]: "" }));
    }
  };

  const updateSubtopicInput = (subjectId: string, value: string) => {
      setNewSubtopics(prev => ({ ...prev, [subjectId]: value }));
  };

  const handleGenerateSubtopics = async (subject: Subject) => {
    setIsGenerating(subject.id);
    try {
      // Pass the user's health degree (e.g., 'Medicine', 'Nursing') to get relevant subtopics
      const generatedTopics = await generateSubtopicsForSubject(subject.title, settings.healthDegree);
      if (generatedTopics.length > 0) {
        importSubtopics(subject.id, generatedTopics);
        if (!expandedSubjects.includes(subject.id)) {
            toggleExpand(subject.id);
        }
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
      <div className="flex items-center gap-4 pb-2 border-b border-zinc-100">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 hover:bg-zinc-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-zinc-500" />
        </Button>
        <div>
            <h2 className="text-2xl font-bold text-zinc-900">Conteúdo do Assunto</h2>
            <div className="text-xs text-zinc-400">
                {subjects.length} matérias cadastradas
            </div>
        </div>
      </div>

      {/* Create New Subject Input */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-2 rounded-3xl border border-zinc-100 shadow-sm"
      >
          <form onSubmit={handleAddSubject} className="relative flex items-center">
             <div className="absolute left-4 text-zinc-400 pointer-events-none">
                 <BookOpen className="w-5 h-5" />
             </div>
             <Input 
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Adicionar nova matéria... (Ex: Cardiologia)"
                className="pl-12 h-14 border-none shadow-none text-base bg-transparent focus-visible:ring-0"
             />
             <Button 
                type="submit" 
                size="sm" 
                className="h-10 px-6 rounded-xl mr-2 font-semibold"
                disabled={!newSubjectName.trim()}
             >
                Adicionar
             </Button>
          </form>
      </motion.div>

      <div className="space-y-4">
        {subjects.length === 0 && (
          <div className="text-center py-16 bg-zinc-50/50 rounded-3xl border border-dashed border-zinc-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100 shadow-sm">
                <BookOpen className="w-6 h-6 text-zinc-300" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">Nenhuma matéria adicionada</h3>
            <p className="text-zinc-500 max-w-xs mx-auto mt-2">
                Comece adicionando as disciplinas que cairão neste assunto usando o campo acima.
            </p>
          </div>
        )}

        <AnimatePresence>
          {subjects.map((subject) => {
             const progress = getSubjectProgress(subject.id);
             const isExpanded = expandedSubjects.includes(subject.id);
             const subtopicInput = newSubtopics[subject.id] || "";

             return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-zinc-200 rounded-2xl bg-white shadow-sm overflow-hidden"
            >
              <div 
                className="flex flex-col p-5 cursor-pointer bg-white transition-colors hover:bg-zinc-50/50"
                onClick={() => toggleExpand(subject.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-zinc-400" /> : <ChevronRight className="w-5 h-5 text-zinc-400" />}
                    <div>
                      <h3 className="font-bold text-lg text-zinc-900">{subject.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {subject.tag && (
                          <span className="inline-flex items-center text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                            <TagIcon className="w-3 h-3 mr-1" />
                            {subject.tag}
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
                      title="Sugerir tópicos com IA"
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
                   <span className="text-xs text-zinc-400 w-8 text-right font-medium">{progress}%</span>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-zinc-50/50 p-5 pt-0 border-t border-zinc-100">
                  <div className="space-y-1 mt-4">
                    {subject.subtopics.map((subtopic) => (
                      <div key={subtopic.id} className="flex items-center gap-3 group py-2 px-2 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-zinc-100">
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
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Fixed Input for adding subtopics */}
                    <form onSubmit={(e) => handleAddSubtopic(e, subject.id)} className="flex gap-2 mt-4 pt-2">
                      <div className="relative flex-1">
                          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <Input
                            value={subtopicInput}
                            onChange={(e) => updateSubtopicInput(subject.id, e.target.value)}
                            placeholder="Adicionar subtópico..."
                            className="h-10 text-sm bg-white pl-9 border-zinc-200 focus:ring-2 ring-offset-0 focus:ring-zinc-100 focus:border-zinc-300"
                          />
                      </div>
                      <Button type="submit" size="sm" variant="default" className="bg-zinc-900 h-10 px-4" disabled={!subtopicInput.trim()}>
                        Adicionar
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/20 backdrop-blur-sm p-4"
            onClick={() => setDeleteSubjectId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-zinc-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4 text-red-600">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-zinc-900">Excluir Matéria?</h3>
              </div>
              <p className="text-zinc-500 mb-6 text-sm leading-relaxed">
                Tem certeza que deseja excluir esta matéria e todos os seus tópicos? Esta ação não pode ser desfeita.
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
