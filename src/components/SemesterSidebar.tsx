'use client';

import React from 'react';
import { useCurriculumStore } from '@/store/useCurriculumStore';

export const SemesterSidebar: React.FC = () => {
  const selectedSemester = useCurriculumStore((state) => state.selectedSemester);
  const setSelectedSemester = useCurriculumStore((state) => state.setSelectedSemester);
  const setSelectedCourseId = useCurriculumStore((state) => state.setSelectedCourseId);
  const activeMajor = useCurriculumStore((state) => state.activeMajor);

  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const electivesLabel = activeMajor === 'CS' ? 'Pilihan (6-8)' : 'Pilihan (5-8)';

  return (
    <div className="fixed left-4 top-20 z-30 flex flex-col gap-2 p-3 rounded-lg border border-[#333333] bg-[#1E1E1E]/80 backdrop-blur-md shadow-lg select-none w-44">
      <div className="text-xs font-bold text-[#C5A059] uppercase tracking-wider px-1 mb-1">
        Semester
      </div>
      
      <div className="grid grid-cols-2 gap-1.5">
        {semesters.map((sem) => (
          <button
            key={sem}
            onClick={() => {
              setSelectedSemester(sem);
              setSelectedCourseId(null);
            }}
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
        onClick={() => {
          setSelectedSemester('pilihan');
          setSelectedCourseId(null);
        }}
        className={`w-full mt-2 py-2 rounded text-xs font-bold font-sans transition-all cursor-pointer border text-center
          ${selectedSemester === 'pilihan'
            ? 'bg-[#C5A059] text-[#111111] border-[#C5A059] shadow-md shadow-[#C5A059]/20'
            : 'bg-[#1E1E1E] text-[#E2E8F0] border-[#333333] hover:bg-[#333333] hover:border-[#444444]'
          }`}
      >
        {electivesLabel}
      </button>

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
