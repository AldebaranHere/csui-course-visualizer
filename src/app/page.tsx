'use client';

import React, { useMemo } from 'react';
import { useCurriculumStore } from '@/store/useCurriculumStore';
import { CurriculumGraph } from '@/components/CurriculumGraph';
import { CourseDrawer } from '@/components/CourseDrawer';
import { TopNav } from '@/components/TopNav';
import { CurriculumMap } from '@/types/curriculum';

// Import JSON datasets directly
import csCoursesRaw from '@/data/cs_courses.json';
import isCoursesRaw from '@/data/is_courses.json';

import { ReactFlowProvider } from 'reactflow';

// Type-cast datasets to CurriculumMap
const csCourses = csCoursesRaw as CurriculumMap;
const isCourses = isCoursesRaw as CurriculumMap;

export default function Home() {
  const activeMajor = useCurriculumStore((state) => state.activeMajor);

  // Dynamically select the current active curriculum dataset
  const activeCourses = useMemo(() => {
    return activeMajor === 'CS' ? csCourses : isCourses;
  }, [activeMajor]);

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen w-screen bg-[#111111] text-[#F8FAFC] overflow-hidden">
        {/* Top Navbar */}
        <TopNav />

        {/* Main Workspace */}
        <main className="flex-1 relative w-full h-full pt-16">
          <CurriculumGraph courses={activeCourses} />
        </main>

        {/* Slide-out Drawer */}
        <CourseDrawer courses={activeCourses} />
      </div>
    </ReactFlowProvider>
  );
}
