import { create } from 'zustand';

interface CurriculumState {
  activeMajor: 'CS' | 'IS';
  selectedCourseId: string | null;
  searchQuery: string;
  highlightedNodes: Set<string>;
  setActiveMajor: (major: 'CS' | 'IS') => void;
  setSelectedCourseId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setHighlightedNodes: (nodes: Set<string>) => void;
}

export const useCurriculumStore = create<CurriculumState>((set) => ({
  activeMajor: 'CS',
  selectedCourseId: null,
  searchQuery: '',
  highlightedNodes: new Set<string>(),

  setActiveMajor: (major) =>
    set({
      activeMajor: major,
      selectedCourseId: null,
      searchQuery: '',
      highlightedNodes: new Set<string>(),
    }),

  setSelectedCourseId: (id) =>
    set({
      selectedCourseId: id,
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setHighlightedNodes: (nodes) => set({ highlightedNodes: nodes }),
}));
