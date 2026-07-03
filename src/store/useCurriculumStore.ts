import { create } from 'zustand';

interface CurriculumState {
  activeMajor: 'CS' | 'IS';
  selectedCourseId: string | null;
  searchQuery: string;
  highlightedNodes: Set<string>;
  selectedSemester: string | null;
  setActiveMajor: (major: 'CS' | 'IS') => void;
  setSelectedCourseId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setHighlightedNodes: (nodes: Set<string>) => void;
  setSelectedSemester: (semester: string | null) => void;
}

export const useCurriculumStore = create<CurriculumState>((set) => ({
  activeMajor: 'CS',
  selectedCourseId: null,
  searchQuery: '',
  highlightedNodes: new Set<string>(),
  selectedSemester: null,

  setActiveMajor: (major) =>
    set({
      activeMajor: major,
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
