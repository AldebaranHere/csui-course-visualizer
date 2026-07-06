import { create } from 'zustand';
import { StudyProgram } from '@/types/curriculum';

interface CurriculumState {
  activeProgram: StudyProgram;
  selectedCourseId: string | null;
  searchQuery: string;
  highlightedNodes: Set<string>;
  selectedSemester: string | null;
  setActiveProgram: (program: StudyProgram) => void;
  setSelectedCourseId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setHighlightedNodes: (nodes: Set<string>) => void;
  setSelectedSemester: (semester: string | null) => void;
}

export const useCurriculumStore = create<CurriculumState>((set) => ({
  activeProgram: 'CS',
  selectedCourseId: null,
  searchQuery: '',
  highlightedNodes: new Set<string>(),
  selectedSemester: null,

  setActiveProgram: (program) =>
    set({
      activeProgram: program,
      selectedCourseId: null,
      searchQuery: '',
      highlightedNodes: new Set<string>(),
      selectedSemester: null,
    }),

  setSelectedCourseId: (id) =>
    set({
      selectedCourseId: id,
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setHighlightedNodes: (nodes) => set({ highlightedNodes: nodes }),

  setSelectedSemester: (semester) => set({ selectedSemester: semester }),
}));
