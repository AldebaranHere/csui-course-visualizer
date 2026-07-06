'use client';

import React from 'react';
import { useCurriculumStore } from '@/store/useCurriculumStore';

export const SemesterSidebar: React.FC = () => {
  const selectedSemester = useCurriculumStore((state) => state.selectedSemester);
  const setSelectedSemester = useCurriculumStore((state) => state.setSelectedSemester);
  const setSelectedCourseId = useCurriculumStore((state) => state.setSelectedCourseId);
  const activeProgram = useCurriculumStore((state) => state.activeProgram);

  const isCS = activeProgram === 'CS' || activeProgram === 'CS_KKI';
  const isAI = activeProgram === 'AI';

  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const electivesLabel = isCS ? 'Pilihan (6-8)' : 'Pilihan (5-8)';

  const aiCategories = [
    { key: 'MATHEMATICAL FOUNDATIONS', label: 'Math Foundations' },
    { key: 'AI MODELING AND ETHICS', label: 'AI Modeling & Ethics' },
    { key: 'PROGRAMMING FOUNDATIONS', label: 'Programming Foundations' },
    { key: 'DATA, SYSTEMS, AND SOLUTION DEVELOPMENT', label: 'Systems & Dev' },
    { key: 'GENERAL REQUIREMENTS & UNDERGRADUATE RESEARCH', label: 'General & Research' },
    { key: 'Mata Kuliah Pilihan', label: 'Pilihan' }
  ];

  const handleSelect = (value: string) => {
    setSelectedSemester(value);
    setSelectedCourseId(null);
  };

  return (
    <div className="fixed left-4 top-20 z-30 flex flex-col gap-2 p-3 rounded-lg border border-[#333333] bg-[#1E1E1E]/80 backdrop-blur-md shadow-lg select-none w-44">
      <div className="text-xs font-bold text-[#C5A059] uppercase tracking-wider px-1 mb-1">
        {isAI ? 'Kategori AI' : 'Semester'}
      </div>
      
      {isAI ? (
        <div className="flex flex-col gap-1.5">
          {aiCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleSelect(cat.key)}
              className={`py-2 px-2.5 rounded text-[10px] font-bold font-sans transition-all cursor-pointer border text-left leading-tight
                ${selectedSemester === cat.key
                  ? 'bg-[#C5A059] text-[#111111] border-[#C5A059] shadow-md shadow-[#C5A059]/20'
                  : 'bg-[#1E1E1E] text-[#E2E8F0] border-[#333333] hover:bg-[#333333] hover:border-[#444444]'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {semesters.map((sem) => (
              <button
                key={sem}
                onClick={() => handleSelect(sem)}
                className={`py-1.5 rounded text-xs font-bold font-sans transition-all cursor-pointer border text-center
                  ${selectedSemester === sem
                    ? 'bg-[#C5A059] text-[#111111] border-[#C5A059] shadow-md shadow-[#C5A059]/20'
                    : 'bg-[#1E1E1E] text-[#E2E8F0] border-[#333333] hover:bg-[#333333] hover:border-[#444444]'
                  }`}
              >
                Sem {sem}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleSelect('pilihan')}
            className={`w-full mt-2 py-2 rounded text-xs font-bold font-sans transition-all cursor-pointer border text-center
              ${selectedSemester === 'pilihan'
                ? 'bg-[#C5A059] text-[#111111] border-[#C5A059] shadow-md shadow-[#C5A059]/20'
                : 'bg-[#1E1E1E] text-[#E2E8F0] border-[#333333] hover:bg-[#333333] hover:border-[#444444]'
              }`}
          >
            {electivesLabel}
          </button>
        </>
      )}

      {selectedSemester && (
        <button
          onClick={() => {
            setSelectedSemester(null);
            setSelectedCourseId(null);
          }}
          className="w-full mt-1.5 py-1.5 rounded text-[10px] font-sans font-bold text-[#EF4444] border border-transparent hover:border-[#EF4444]/20 hover:bg-[#EF4444]/10 transition-all cursor-pointer text-center"
        >
          Hapus Filter
        </button>
      )}
    </div>
  );
};
