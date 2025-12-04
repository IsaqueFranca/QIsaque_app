import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Subject, Session, Settings, Subtopic, Month, User } from '../types';
import { generateId, formatDate, calculateStreaks } from '../lib/utils';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface StudyState {
  user: User | null;
  isGuest: boolean; // Novo estado para controlar modo visitante
  months: Month[];
  subjects: Subject[];
  sessions: Session[];
  settings: Settings;
  
  // User Actions
  setUser: (user: User | null) => void;
  setGuestMode: (isGuest: boolean) => void; // Ação para ativar/desativar modo visitante
  loadFromCloud: (uid: string) => Promise<void>;
  
  // Month Actions
  addMonth: (name: string, year?: number) => void;
  editMonth: (id: string, name: string) => void;
  deleteMonth: (id: string) => void;

  // Subject Actions
  addSubject: (title: string, monthId: string, tag?: string, weeklyGoal?: number) => string;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  
  // Subtopic Actions
  addSubtopic: (subjectId: string, title: string) => void;
  toggleSubtopic: (subjectId: string, subtopicId: string) => void;
  deleteSubtopic: (subjectId: string, subtopicId: string) => void;
  importSubtopics: (subjectId: string, titles: string[]) => void;

  // Study Logic
  toggleStudyDay: (subjectId: string, date: string) => void;
  isStudiedToday: (subjectId: string) => boolean;

  // Session Actions
  addSession: (session: Omit<Session, 'id'>) => void;
  updateSessionStatus: (sessionId: string, status: 'completed' | 'incomplete') => void;
  deleteSession: (sessionId: string) => void;
  
  updateSettings: (updates: Partial<Settings>) => void;

  // Selectors
  getSubjectsByMonthId: (monthId: string) => Subject[];
  getSessionsByMonthId: (monthId: string) => Session[];
  getTotalTimeByMonthId: (monthId: string) => number;
  getTimeBySubject: (subjectId: string) => number;
  getSubjectProgress: (subjectId: string) => number;
  getStreakStats: () => { currentStreak: number; longestStreak: number; totalActiveDays: number; dayMap: Map<string, number> };
}

// Helper to debounce cloud saves
let saveTimeout: ReturnType<typeof setTimeout>;
const saveToCloud = (state: StudyState) => {
  // Só salva se tiver usuário logado. Modo visitante é ignorado aqui (apenas local).
  if (!state.user?.uid) return;
  
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      const dataToSave = {
        months: state.months,
        subjects: state.subjects,
        sessions: state.sessions,
        settings: state.settings,
        lastUpdated: new Date().toISOString()
      };
      await setDoc(doc(db, "users", state.user!.uid), dataToSave, { merge: true });
      console.log("Dados sincronizados com a nuvem.");
    } catch (e) {
      console.error("Erro ao sincronizar:", e);
    }
  }, 2000); // Wait 2s of inactivity before saving
};

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      user: null,
      isGuest: false,
      months: [
        { id: 'default-1', name: 'Janeiro', year: new Date().getFullYear() },
        { id: 'default-2', name: 'Fevereiro', year: new Date().getFullYear() },
      ],
      subjects: [],
      sessions: [],
      settings: {
        pomodoroDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        monthlyGoalHours: 40,
        userName: 'Dr(a). Estudante',
        finalGoal: 'Aprovação na Residência',
        healthDegree: 'Medicine',
      },

      setUser: (user) => set({ user, isGuest: false }), // Ao logar, desativa modo visitante
      
      setGuestMode: (isGuest) => set({ isGuest }),

      loadFromCloud: async (uid) => {
        try {
          const docRef = doc(db, "users", uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Merge logic: Cloud data overwrites local if exists, ensuring user gets their data back
            set((state) => ({
              months: data.months || state.months,
              subjects: data.subjects || state.subjects,
              sessions: data.sessions || state.sessions,
              settings: data.settings || state.settings
            }));
            console.log("Dados carregados da nuvem.");
          }
        } catch (e) {
          console.error("Erro ao carregar dados:", e);
        }
      },

      // Month Actions
      addMonth: (name, year) => {
        set((state) => ({
          months: [...state.months, { 
            id: generateId(), 
            name,
            year: year || new Date().getFullYear()
          }]
        }));
        saveToCloud(get());
      },

      editMonth: (id, name) => {
        set((state) => ({
          months: state.months.map(m => m.id === id ? { ...m, name } : m)
        }));
        saveToCloud(get());
      },

      deleteMonth: (id) => {
        set((state) => ({
          months: state.months.filter(m => m.id !== id),
          subjects: state.subjects.filter(s => s.monthId !== id)
        }));
        saveToCloud(get());
      },

      // Subject Actions
      addSubject: (title, monthId, tag, weeklyGoal) => {
        const newId = generateId();
        set((state) => ({
          subjects: [...state.subjects, {
            id: newId,
            title,
            monthId,
            tag,
            weeklyGoal,
            color: 'bg-blue-500',
            subtopics: [],
            studiedDates: []
          }]
        }));
        saveToCloud(get());
        return newId;
      },

      updateSubject: (id, updates) => {
        set((state) => ({
          subjects: state.subjects.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
        saveToCloud(get());
      },

      deleteSubject: (id) => {
        set((state) => ({
          subjects: state.subjects.filter(s => s.id !== id)
        }));
        saveToCloud(get());
      },

      // Subtopic Actions
      addSubtopic: (subjectId, title) => {
        set((state) => ({
          subjects: state.subjects.map(s => {
            if (s.id !== subjectId) return s;
            return {
              ...s,
              subtopics: [...s.subtopics, { id: generateId(), title, isCompleted: false }]
            };
          })
        }));
        saveToCloud(get());
      },

      toggleSubtopic: (subjectId, subtopicId) => {
        set((state) => ({
          subjects: state.subjects.map(s => {
            if (s.id !== subjectId) return s;
            return {
              ...s,
              subtopics: s.subtopics.map(st => 
                st.id === subtopicId ? { ...st, isCompleted: !st.isCompleted } : st
              )
            };
          })
        }));
        saveToCloud(get());
      },

      deleteSubtopic: (subjectId, subtopicId) => {
        set((state) => ({
          subjects: state.subjects.map(s => {
            if (s.id !== subjectId) return s;
            return {
              ...s,
              subtopics: s.subtopics.filter(st => st.id !== subtopicId)
            };
          })
        }));
        saveToCloud(get());
      },

      importSubtopics: (subjectId, titles) => {
        set((state) => ({
          subjects: state.subjects.map(s => {
            if (s.id !== subjectId) return s;
            const newSubtopics = titles.map(t => ({ id: generateId(), title: t, isCompleted: false }));
            return {
              ...s,
              subtopics: [...s.subtopics, ...newSubtopics]
            };
          })
        }));
        saveToCloud(get());
      },

      toggleStudyDay: (subjectId, date) => {
        set((state) => ({
          subjects: state.subjects.map(s => {
            if (s.id !== subjectId) return s;
            const isStudied = s.studiedDates.includes(date);
            return {
              ...s,
              studiedDates: isStudied 
                ? s.studiedDates.filter(d => d !== date)
                : [...s.studiedDates, date]
            };
          })
        }));
        saveToCloud(get());
      },

      isStudiedToday: (subjectId) => {
        const today = formatDate(new Date());
        return get().subjects.find(s => s.id === subjectId)?.studiedDates.includes(today) || false;
      },

      // Session Actions
      addSession: (sessionData) => {
        set((state) => ({
          sessions: [...state.sessions, { ...sessionData, id: generateId() }]
        }));
        saveToCloud(get());
      },

      updateSessionStatus: (sessionId, status) => {
        set((state) => ({
          sessions: state.sessions.map(s => s.id === sessionId ? { ...s, status } : s)
        }));
        saveToCloud(get());
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter(s => s.id !== sessionId)
        }));
        saveToCloud(get());
      },

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }));
        saveToCloud(get());
      },

      // Selectors
      getSubjectsByMonthId: (monthId) => {
        return get().subjects.filter(s => s.monthId === monthId);
      },

      getSessionsByMonthId: (monthId) => {
        const monthSubjects = get().subjects.filter(s => s.monthId === monthId).map(s => s.id);
        return get().sessions.filter(s => monthSubjects.includes(s.subjectId));
      },

      getTotalTimeByMonthId: (monthId) => {
        const sessions = get().getSessionsByMonthId(monthId);
        const completedSessions = sessions.filter(s => s.status === 'completed');
        return completedSessions.reduce((acc, curr) => acc + curr.duration, 0);
      },

      getTimeBySubject: (subjectId) => {
        const sessions = get().sessions.filter(s => s.subjectId === subjectId && s.status === 'completed');
        return sessions.reduce((acc, curr) => acc + curr.duration, 0);
      },

      getSubjectProgress: (subjectId) => {
        const subject = get().subjects.find(s => s.id === subjectId);
        if (!subject || subject.subtopics.length === 0) return 0;
        
        const completed = subject.subtopics.filter(s => s.isCompleted).length;
        return Math.round((completed / subject.subtopics.length) * 100);
      },

      getStreakStats: () => {
        const completedSessions = get().sessions.filter(s => s.status === 'completed');
        return calculateStreaks(completedSessions);
      }
    }),
    {
      name: 'study-store',
      partialize: (state) => ({
        // Persist local data and guest state
        months: state.months,
        subjects: state.subjects,
        sessions: state.sessions,
        settings: state.settings,
        user: state.user,
        isGuest: state.isGuest
      })
    }
  )
);