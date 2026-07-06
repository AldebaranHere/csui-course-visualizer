import { StudyProgram, CurriculumMap } from '@/types/curriculum';
import csCourses from './cs_courses.json';
import isCourses from './is_courses.json';
import aiCourses from './ai_courses.json';
import csKkiCourses from './cs_kki_courses.json';
import isKkiCourses from './is_kki_courses.json';

export interface ProgramRegistryEntry {
  name: string;
  category: 'Reguler' | 'KKI';
  data: CurriculumMap;
}

export const PROGRAM_REGISTRY: Record<StudyProgram, ProgramRegistryEntry> = {
  'CS': { name: 'Ilmu Komputer (IK)', category: 'Reguler', data: csCourses as unknown as CurriculumMap },
  'IS': { name: 'Sistem Informasi (SI)', category: 'Reguler', data: isCourses as unknown as CurriculumMap },
  'AI': { name: 'Kecerdasan Artifisial (AI)', category: 'Reguler', data: aiCourses as unknown as CurriculumMap },
  'CS_KKI': { name: 'Ilmu Komputer KKI', category: 'KKI', data: csKkiCourses as unknown as CurriculumMap },
  'IS_KKI': { name: 'Sistem Informasi KKI', category: 'KKI', data: isKkiCourses as unknown as CurriculumMap },
};
