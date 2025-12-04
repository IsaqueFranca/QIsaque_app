
export type HealthDegree = 
  | 'Pharmacy'
  | 'Medicine'
  | 'Nursing'
  | 'Dentistry'
  | 'Physiotherapy'
  | 'Biomedicine'
  | 'Nutrition'
  | 'Clinical Analysis'
  | 'Radiology';

export interface Subtopic {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Month {
  id: string;
  name: string;
  year?: number; // Added year field
}

export interface Subject {
  id: string;
  title: string;
  monthId: string; // Links to Month.id
  tag?: string;
  weeklyGoal?: number; // Hours
  color: string;
  subtopics: Subtopic[];
  studiedDates: string[]; // ISO date strings (YYYY-MM-DD)
}

export interface Session {
  id: string;
  subjectId: string;
  startTime: number; // Timestamp
  duration: number; // Seconds
  date: string; // ISO Date YYYY-MM-DD
  status: 'completed' | 'incomplete';
}

export interface Settings {
  pomodoroDuration: number; // Minutes
  shortBreakDuration: number; // Minutes
  longBreakDuration: number; // Minutes
  monthlyGoalHours: number;
  userName: string;
  finalGoal: string;
  healthDegree: HealthDegree; // New field
}

export interface WeeklyProgress {
  week: number;
  total: number;
  completed: number;
}