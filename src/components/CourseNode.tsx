import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useCurriculumStore } from '@/store/useCurriculumStore';
import { Course } from '@/types/curriculum';
import { PROGRAM_REGISTRY } from '@/data/programRegistry';

const CourseNode: React.FC<NodeProps<Course>> = ({ id, data }) => {
  const selectedCourseId = useCurriculumStore((state) => state.selectedCourseId);
  const highlightedNodes = useCurriculumStore((state) => state.highlightedNodes);
  const setSelectedCourseId = useCurriculumStore((state) => state.setSelectedCourseId);
  const selectedSemester = useCurriculumStore((state) => state.selectedSemester);
  const setSelectedSemester = useCurriculumStore((state) => state.setSelectedSemester);

  const activeProgram = useCurriculumStore((state) => state.activeProgram);

  const isSelected = selectedCourseId === id;
  const isAI = activeProgram === 'AI';
  
  // Semester/Category filtering logic
  const isSemesterMatch =
    selectedSemester === null ||
    (isAI
      ? data.category === selectedSemester
      : (selectedSemester === 'pilihan' && data.state === 'Pilihan') ||
        (selectedSemester !== 'pilihan' && data.recommendedSemester?.toString() === selectedSemester));

  const isSemesterFilteredAndMatched = selectedSemester !== null && isSemesterMatch;

  // Check if there is an active course click selection or search query highlighting
  const hasHighlight = highlightedNodes.size > 0;
  const isHighlighted = highlightedNodes.has(id);

  let isNodeDimmed = false;
  if (hasHighlight) {
    // If there's an active path highlighting, ONLY highlight relevant courses on the path, dim everything else (ignoring semester constraints)
    isNodeDimmed = !isHighlighted;
  } else if (selectedSemester !== null) {
    // If no course is clicked but a semester filter is active, only show the matched semester courses
    isNodeDimmed = !isSemesterMatch;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedSemester !== null) {
      setSelectedSemester(null);
    }
    setSelectedCourseId(id);
  };

  const courses = PROGRAM_REGISTRY[activeProgram]?.data || {};
  const outgoingCount = Object.values(courses).filter((c) => c.prerequisites?.includes(id)).length;
  const maxConn = Math.max(data.prerequisites ? data.prerequisites.length : 0, outgoingCount);
  const nodeWidth = Math.max(320, maxConn * 40);

  return (
    <div
      onClick={handleClick}
      className={`p-4 bg-[#1E1E1E] border rounded-[4px] shadow-lg transition-all duration-200 cursor-pointer select-none
        ${isSelected 
          ? 'border-[#C5A059] scale-105 ring-1 ring-[#C5A059]' 
          : isSemesterFilteredAndMatched
            ? 'border-[#C5A059] ring-2 ring-[#C5A059] shadow-lg shadow-[#C5A059]/20'
            : 'border-[#333333] hover:bg-[#2A2A2A]'
        }
        ${isNodeDimmed ? 'opacity-20 hover:opacity-80' : 'opacity-100'}
      `}
      style={{ width: `${nodeWidth}px`, minHeight: '80px' }}
    >
      {Array.from({ length: data.prerequisites ? data.prerequisites.length : 1 }).map((_, index) => {
        const total = data.prerequisites ? data.prerequisites.length : 1;
        const offset = (index - (total - 1) / 2) * 40;
        const leftPercent = `calc(50% + ${offset - 4}px)`;
        return (
          <Handle
            key={`target-${index}`}
            type="target"
            id={`target-${index}`}
            position={Position.Top}
            style={{ left: leftPercent, top: '-4px', transform: 'none' }}
            className="!bg-[#333333] !border-none !w-2 !h-2"
          />
        );
      })}
      
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-[13px] font-medium tracking-wider text-[#C5A059]">
          {id}
        </span>
        <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#333333] text-[#E2E8F0] font-sans">
          {data.credits} SKS
        </span>
      </div>
      
      <h3 className="font-sans text-[15px] font-bold text-[#F8FAFC] leading-snug line-clamp-2">
        {data.name}
      </h3>
      
      <div className="mt-2 pt-1.5 border-t border-[#333333]/50 flex justify-between items-center text-[11px] text-[#E2E8F0]">
        <span className="truncate max-w-[140px]" title={data.state}>
          {data.state}
        </span>
        {data.prerequisites.length > 0 && (
          <span className="text-[#C5A059] font-mono text-[10px]">
            PR: {data.prerequisites.length}
          </span>
        )}
      </div>

      {Array.from({ length: outgoingCount || 1 }).map((_, index) => {
        const total = outgoingCount || 1;
        const offset = (index - (total - 1) / 2) * 40;
        const leftPercent = `calc(50% + ${offset - 4}px)`;
        return (
          <Handle
            key={`source-${index}`}
            type="source"
            id={`source-${index}`}
            position={Position.Bottom}
            style={{ left: leftPercent, bottom: '-4px', transform: 'none' }}
            className="!bg-[#333333] !border-none !w-2 !h-2"
          />
        );
      })}
    </div>
  );
};

export default React.memo(CourseNode);
