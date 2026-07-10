import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useCurriculumStore } from '@/store/useCurriculumStore';
import { Course } from '@/types/curriculum';

interface CourseDrawerProps {
  courses: Record<string, Course>;
}

export const CourseDrawer: React.FC<CourseDrawerProps> = ({ courses }) => {
  const selectedCourseId = useCurriculumStore((state) => state.selectedCourseId);
  const setSelectedCourseId = useCurriculumStore((state) => state.setSelectedCourseId);

  const course = selectedCourseId ? courses[selectedCourseId] : null;

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedCourseId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedCourseId]);

  return (
    <aside
      className={`fixed top-0 right-0 h-screen w-96 bg-[#1E1E1E] border-l border-[#333333] z-50 flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.5)] transition-transform duration-200 ease-out transform
        ${course ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start p-6 border-b border-[#333333] shrink-0">
        <div>
          <span className="font-mono text-xs font-bold tracking-wider text-[#C5A059] block mb-1">
            {course?.code}
          </span>
          {course?.name && (
            <h2 className="font-sans text-[22px] font-bold text-[#F8FAFC] leading-snug">
              {course.name}
            </h2>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2.5 py-0.5 rounded bg-[#333333] text-[#F8FAFC]">
              {course?.credits} SKS
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded border border-[#333333] text-[#E2E8F0]">
              {course?.state}
            </span>
          </div>
        </div>
        <button
          onClick={() => setSelectedCourseId(null)}
          className="text-[#E2E8F0] hover:text-[#C5A059] p-2 hover:bg-[#333333] rounded transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
        {course ? (
          <>
            {/* Description */}
            <div>
              <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                Deskripsi
              </h4>
              <p className="font-sans text-sm text-[#E2E8F0] leading-relaxed">
                {course.description || 'Tidak ada deskripsi tersedia.'}
              </p>
            </div>

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                  Prasyarat
                </h4>
                <div className="flex flex-wrap gap-2">
                  {course.prerequisites.map((prereq) => (
                    <button
                      key={prereq}
                      onClick={() => setSelectedCourseId(prereq)}
                      className="font-mono text-xs px-3 py-1.5 bg-[#2A2A2A] border border-[#333333] text-[#F8FAFC] rounded hover:border-[#C5A059] transition-colors duration-200 cursor-pointer min-h-[36px]"
                    >
                      {prereq}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Topics */}
            {course.topics && course.topics.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                  Pokok Bahasan
                </h4>
                <ul className="space-y-2">
                  {course.topics.map((topic, index) => (
                    <li key={index} className="flex items-start text-sm text-[#E2E8F0]">
                      <span className="text-[#C5A059] mr-2.5 mt-1 select-none">•</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Learning Outcomes */}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                  Capaian Pembelajaran (CPL)
                </h4>
                <ul className="space-y-2">
                  {course.learningOutcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start text-sm text-[#E2E8F0]">
                      <span className="text-[#C5A059] mr-2.5 mt-1 select-none">•</span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sublearning Outcomes */}
            {course.sublearningOutcomes && course.sublearningOutcomes.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                  Sub-Capaian Pembelajaran
                </h4>
                <ul className="space-y-2">
                  {course.sublearningOutcomes.map((sub, index) => (
                    <li key={index} className="flex items-start text-sm text-[#E2E8F0]">
                      <span className="text-[#C5A059] mr-2.5 mt-1 select-none">•</span>
                      <span>{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resources */}
            {course.resources && course.resources.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                  Pustaka & Alat
                </h4>
                <ul className="space-y-2">
                  {course.resources.map((resource, index) => (
                    <li key={index} className="flex items-start text-sm text-[#E2E8F0]">
                      <span className="text-[#C5A059] mr-2.5 mt-1 select-none">•</span>
                      <span>{resource}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisite of (Immediate Successors) */}
            {(() => {
              const successors = Object.values(courses).filter(
                (c) => c.prerequisites && c.prerequisites.includes(selectedCourseId || '')
              );
              if (successors.length === 0) return null;
              return (
                <div>
                  <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                    Prasyarat Untuk
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {successors.map((succ) => (
                      <button
                        key={succ.code}
                        onClick={() => setSelectedCourseId(succ.code)}
                        className="font-mono text-xs px-3 py-1.5 bg-[#2A2A2A] border border-[#333333] text-[#F8FAFC] rounded hover:border-[#C5A059] transition-colors duration-200 cursor-pointer min-h-[36px]"
                      >
                        {succ.code}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-[#E2E8F0]/50 text-sm">
            Pilih mata kuliah untuk melihat detail.
          </div>
        )}
      </div>
    </aside>
  );
};
