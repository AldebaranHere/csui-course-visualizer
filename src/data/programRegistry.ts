import { StudyProgram, CurriculumMap } from '@/types/curriculum';

// All JSON files are statically imported so webpack can bundle them reliably.
// Dynamic import() of JSON is unreliable across webpack/Next.js configurations
// (module may expose named exports instead of .default, or require import assertions).
// The real layout performance gains come from useDeferredValue (P3), not bundle splitting.
import csCourses from './cs_courses.json';
import isCourses from './is_courses.json';
import aiCourses from './ai_courses.json';
import csKkiCourses from './cs_kki_courses.json';
import isKkiCourses from './is_kki_courses.json';

export interface ProgramRegistryEntry {
  name: string;
  category: 'Reguler' | 'KKI';
}

// Metadata only — no JSON data stored here, just labels for the dropdown
export const PROGRAM_REGISTRY: Record<StudyProgram, ProgramRegistryEntry> = {
  'CS':     { name: 'Ilmu Komputer (IK)',        category: 'Reguler' },
  'IS':     { name: 'Sistem Informasi (SI)',      category: 'Reguler' },
  'AI':     { name: 'Kecerdasan Artifisial (AI)', category: 'Reguler' },
  'CS_KKI': { name: 'Ilmu Komputer KKI',         category: 'KKI'     },
  'IS_KKI': { name: 'Sistem Informasi KKI',      category: 'KKI'     },
};

// The dataset map — synchronous lookup by program key.
// Wrapped in a function so callers don't need to be async.
const PROGRAM_DATA: Record<StudyProgram, CurriculumMap> = {
  'CS':     csCourses    as unknown as CurriculumMap,
  'IS':     isCourses    as unknown as CurriculumMap,
  'AI':     aiCourses    as unknown as CurriculumMap,
  'CS_KKI': csKkiCourses as unknown as CurriculumMap,
  'IS_KKI': isKkiCourses as unknown as CurriculumMap,
};

/** Returns the course dataset for the given study program. Synchronous. */
export function getProgramData(program: StudyProgram): CurriculumMap {
  return PROGRAM_DATA[program];
}

// Kept for backwards compat — the eager CS dataset used in store initialisation.
export const CS_COURSES: CurriculumMap = csCourses as unknown as CurriculumMap;
