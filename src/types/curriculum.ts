// Updated classification labels
export type CourseState =
  | 'Wajib Universitas'
  | 'Wajib Fakultas'
  | 'Wajib Program Studi'
  | 'Pilihan'
  | 'University Mandatory'
  | 'Faculty Mandatory'
  | 'Program Study Mandatory'
  | 'Elective';

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
  outgoingCount?: number;       // Pre-computed by layout engine; number of courses that require this one
}

export type CurriculumMap = Record<string, Course>;
