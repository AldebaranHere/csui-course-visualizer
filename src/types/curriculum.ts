export type CourseState = 'Wajib Universitas' | 'Wajib Fakultas' | 'Wajib Program Studi' | 'Pilihan';

export interface Course {
  code: string;               // Unique Identifier (e.g., "CS101")
  name: string;               // Complete course title (e.g., "Programming Foundations 1")
  credits: number;            // SKS credit value
  state: CourseState;         // Classification status
  description: string;        // In-depth textbook overview
  topics: string[];           // Bulleted list of syllabus units
  learningOutcomes: string[]; // Program learning goals
  sublearningOutcomes: string[]; // Specific mastery metrics
  resources: string[];        // Recommended textbooks and software tools
  prerequisites: string[];    // Array of course codes acting as directional edge sources
}

// Global data store shape structured as a dictionary
export type CurriculumMap = Record<string, Course>;
