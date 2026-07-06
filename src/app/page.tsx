'use client';

import React, { useMemo } from 'react';
import { useCurriculumStore } from '@/store/useCurriculumStore';
import { CurriculumGraph } from '@/components/CurriculumGraph';
import { CourseDrawer } from '@/components/CourseDrawer';
import { TopNav } from '@/components/TopNav';
import { PROGRAM_REGISTRY } from '@/data/programRegistry';
import { ReactFlowProvider } from 'reactflow';
import { SemesterSidebar } from '@/components/SemesterSidebar';

export default function Home() {
  const activeProgram = useCurriculumStore((state) => state.activeProgram);

  // Dynamically select the current active curriculum dataset from registry
  const activeCourses = useMemo(() => {
    return PROGRAM_REGISTRY[activeProgram].data;
  }, [activeProgram]);

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen w-screen bg-[#111111] text-[#F8FAFC] overflow-hidden">
        {/* Top Navbar */}
        <TopNav />

        {/* Main Workspace */}
        <main className="flex-1 relative w-full h-full pt-16">
          <SemesterSidebar />
          <CurriculumGraph courses={activeCourses} />
        </main>

        {/* Slide-out Drawer */}
        <CourseDrawer courses={activeCourses} />
      </div>
    </ReactFlowProvider>
  );
}
