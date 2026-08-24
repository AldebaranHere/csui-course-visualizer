import React from 'react';
import { EdgeProps, EdgeLabelRenderer } from 'reactflow';
import { useCurriculumStore } from '@/store/useCurriculumStore';

interface PathData {
  d: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export const PrerequisiteEdge: React.FC<EdgeProps> = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  data,
}) => {
  const setSelectedCourseId = useCurriculumStore((state) => state.setSelectedCourseId);
  const selectedSemester = useCurriculumStore((state) => state.selectedSemester);
  const setSelectedSemester = useCurriculumStore((state) => state.setSelectedSemester);

  const pathData: PathData | null = data?.pathData ?? null;
  const path = pathData?.d ?? '';

  const calculatedSourceX = pathData?.sourceX ?? sourceX;
  const calculatedSourceY = pathData?.sourceY ?? sourceY;
  const calculatedTargetX = pathData?.targetX ?? targetX;
  const calculatedTargetY = pathData?.targetY ?? targetY;

  const prereqIndex = data?.prereqIndex || 0;
  const verticalOffsetPrereq = 18 + prereqIndex * 20; // above target card

  const successorIndex = data?.successorIndex || 0;
  const verticalOffsetSuccessor = 8 + successorIndex * 20; // below source card

  const handlePrereqClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedSemester !== null) {
      setSelectedSemester(null);
    }
    setSelectedCourseId(source);
  };

  const handleSuccessorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedSemester !== null) {
      setSelectedSemester(null);
    }
    setSelectedCourseId(target);
  };

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={path}
        markerEnd={markerEnd}
      />
      {data?.showPrereqLabel && data?.sourceCourseName && (
        <EdgeLabelRenderer>
          <div
            onClick={handlePrereqClick}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${calculatedTargetX}px, ${calculatedTargetY - verticalOffsetPrereq}px)`,
              pointerEvents: 'all',
            }}
            className="text-[9px] font-mono font-bold text-[#C5A059] bg-[#111111] hover:bg-[#C5A059] hover:text-[#111111] px-1.5 py-0.5 rounded border border-[#C5A059]/40 shadow-md select-none z-50 transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            {data.sourceCourseName}
          </div>
        </EdgeLabelRenderer>
      )}
      {data?.showSuccessorLabel && data?.targetCourseName && (
        <EdgeLabelRenderer>
          <div
            onClick={handleSuccessorClick}
            style={{
              position: 'absolute',
              transform: `translate(-50%, 0%) translate(${calculatedSourceX}px, ${calculatedSourceY + verticalOffsetSuccessor}px)`,
              pointerEvents: 'all',
            }}
            className="text-[9px] font-mono font-bold text-[#C5A059] bg-[#111111] hover:bg-[#C5A059] hover:text-[#111111] px-1.5 py-0.5 rounded border border-[#C5A059]/40 shadow-md select-none z-50 transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            {data.targetCourseName}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
