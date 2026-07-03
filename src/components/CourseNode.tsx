import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useCurriculumStore } from '@/store/useCurriculumStore';
import { Course } from '@/types/curriculum';

const CourseNode: React.FC<NodeProps<Course>> = ({ id, data }) => {
  const selectedCourseId = useCurriculumStore((state) => state.selectedCourseId);
  const highlightedNodes = useCurriculumStore((state) => state.highlightedNodes);
  const setSelectedCourseId = useCurriculumStore((state) => state.setSelectedCourseId);
  const selectedSemester = useCurriculumStore((state) => state.selectedSemester);

  const isSelected = selectedCourseId === id;
  
  // Semester filtering logic
  const isSemesterMatch =
    selectedSemester === null ||
    (selectedSemester === 'pilihan' && data.state === 'Pilihan') ||
    (selectedSemester !== 'pilihan' && data.recommendedSemester?.toString() === selectedSemester);

  const isSemesterFilteredAndMatched = selectedSemester !== null && isSemesterMatch;
  const isSemesterFilteredAndMismatched = selectedSemester !== null && !isSemesterMatch;

  // A node is active (fully visible) if:
  // 1. There are no highlighted/filtered nodes at all
  // 2. Or the node is in the highlightedNodes set
  const hasHighlight = highlightedNodes.size > 0;
  const isActive = !hasHighlight || highlightedNodes.has(id);

  const isNodeDimmed = !isActive || isSemesterFilteredAndMismatched;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCourseId(id);
  };

  return (
    <div
      onClick={handleClick}
      className={`w-[240px] p-4 bg-[#1E1E1E] border rounded-[4px] shadow-lg transition-all duration-200 cursor-pointer select-none
        ${isSelected 
          ? 'border-[#C5A059] scale-105 ring-1 ring-[#C5A059]' 
          : isSemesterFilteredAndMatched
            ? 'border-[#C5A059] ring-2 ring-[#C5A059] shadow-lg shadow-[#C5A059]/20'
            : 'border-[#333333] hover:bg-[#2A2A2A]'
        }
        ${isNodeDimmed ? 'opacity-20 pointer-events-none' : 'opacity-100'}
      `}
      style={{ minHeight: '80px' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#333333] !border-none !w-2 !h-2"
      />
      
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

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#333333] !border-none !w-2 !h-2"
      />
    </div>
  );
};

export default React.memo(CourseNode);
