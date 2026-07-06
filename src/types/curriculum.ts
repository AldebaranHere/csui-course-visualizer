// Updated classification labels
export type CourseState = 'Wajib Universitas' | 'Wajib Fakultas' | 'Wajib Program Studi' | 'Pilihan';

// Expanded study programs
export type StudyProgram = 'CS' | 'IS' | 'AI' | 'CS_KKI' | 'IS_KKI';

export interface Course {
  code: string;
  name: string;
  credits: number;
  state: CourseState;
  category?: string; // Used for AI program grouping
  description: string;
  topics: string[];
  learningOutcomes: string[];
  sublearningOutcomes?: string[];
  resources: string[];
  prerequisites: string[]; 
  recommendedSemester?: number; // Dynamically added during graph layouts
}

export type CurriculumMap = Record<string, Course>;
