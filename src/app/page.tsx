'use client';

import React, { useMemo } from 'react';
import { useCurriculumStore } from '@/store/useCurriculumStore';
import { CurriculumGraph } from '@/components/CurriculumGraph';
import { CourseDrawer } from '@/components/CourseDrawer';
import { TopNav } from '@/components/TopNav';
import { getProgramData } from '@/data/programRegistry';
import { ReactFlowProvider } from 'reactflow';
import { SemesterSidebar } from '@/components/SemesterSidebar';

export default function Home() {
  const activeProgram = useCurriculumStore((state) => state.activeProgram);

  // Synchronous: all JSON data is statically imported, so no async loading is needed.
  // The expensive Dagre layout computation is deferred via useDeferredValue inside
  // CurriculumGraph (P3), which is where the real performance gain lives.
  const courseData = useMemo(() => getProgramData(activeProgram), [activeProgram]);

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen w-screen bg-[#111111] text-[#F8FAFC] overflow-hidden">
        {/* Top Navbar */}
        <TopNav />

        {/* Main Workspace */}
        <main className="flex-1 relative w-full h-full pt-16">
          <SemesterSidebar />
          <CurriculumGraph courses={courseData} />
        </main>

        {/* Slide-out Drawer */}
        <CourseDrawer courses={courseData} />
      </div>
    </ReactFlowProvider>
  );
}
