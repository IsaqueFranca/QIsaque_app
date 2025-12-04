import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Subject, Session, Settings, Subtopic, Month } from '../types';
import { generateId, formatDate, calculateStreaks } from '../lib/utils';

interface StudyState {
  months: Month[];
  subjects: Subject[];
  sessions: Session[];
  settings: Settings;
  
  // Month Actions
  addMonth: (name: string) => void;
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

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      months: [
        { id: 'default-1', name: 'Janeiro' },
        { id: 'default-2', name: 'Fevereiro' },
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

      // Month Actions
      addMonth: (name) => set((state) => ({
        months: [...state.months, { id: generateId(), name }]
      })),

      editMonth: (id, name) => set((state) => ({
        months: state.months.map(m => m.id === id ? { ...m, name } : m)
      })),

      deleteMonth: (id) => set((state) => ({
        months: state.months.filter(m => m.id !== id),
        subjects: state.subjects.filter(s => s.monthId !== id) // Cascade delete
      })),

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
        return newId;
      },

      updateSubject: (id, updates) => set((state) => ({
        subjects: state.subjects.map(s => s.id === id ? { ...s, ...updates } : s)
      })),

      deleteSubject: (id) => set((state) => ({
        subjects: state.subjects.filter(s => s.id !== id)
      })),

      // Subtopic Actions
      addSubtopic: (subjectId, title) => set((state) => ({
        subjects: state.subjects.map(s => {
          if (s.id !== subjectId) return s;
          return {
            ...s,
            subtopics: [...s.subtopics, { id: generateId(), title, isCompleted: false }]
          };
        })
      })),

      toggleSubtopic: (subjectId, subtopicId) => set((state) => ({
        subjects: state.subjects.map(s => {
          if (s.id !== subjectId) return s;
          return {
            ...s,
            subtopics: s.subtopics.map(st => 
              st.id === subtopicId ? { ...st, isCompleted: !st.isCompleted } : st
            )
          };
        })
      })),

      deleteSubtopic: (subjectId, subtopicId) => set((state) => ({
        subjects: state.subjects.map(s => {
          if (s.id !== subjectId) return s;
          return {
            ...s,
            subtopics: s.subtopics.filter(st => st.id !== subtopicId)
          };
        })
      })),

      importSubtopics: (subjectId, titles) => set((state) => ({
        subjects: state.subjects.map(s => {
          if (s.id !== subjectId) return s;
          const newSubtopics = titles.map(t => ({ id: generateId(), title: t, isCompleted: false }));
          return {
            ...s,
            subtopics: [...s.subtopics, ...newSubtopics]
          };
        })
      })),

      toggleStudyDay: (subjectId, date) => set((state) => ({
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
      })),

      isStudiedToday: (subjectId) => {
        const today = formatDate(new Date());
        return get().subjects.find(s => s.id === subjectId)?.studiedDates.includes(today) || false;
      },

      // Session Actions
      addSession: (sessionData) => set((state) => ({
        sessions: [...state.sessions, { ...sessionData, id: generateId() }]
      })),

      updateSessionStatus: (sessionId, status) => set((state) => ({
        sessions: state.sessions.map(s => s.id === sessionId ? { ...s, status } : s)
      })),

      deleteSession: (sessionId) => set((state) => ({
        sessions: state.sessions.filter(s => s.id !== sessionId)
      })),

      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),

      // Selectors
      getSubjectsByMonthId: (monthId) => {
        return get().subjects.filter(s => s.monthId === monthId);
      },

      getSessionsByMonthId: (monthId) => {
        // Find all subjects in this month
        const monthSubjects = get().subjects.filter(s => s.monthId === monthId).map(s => s.id);
        return get().sessions.filter(s => monthSubjects.includes(s.subjectId));
      },

      getTotalTimeByMonthId: (monthId) => {
        const sessions = get().getSessionsByMonthId(monthId);
        // Only count completed sessions for total stats
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
    }
  )
);