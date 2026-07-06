import React from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';
import { useCurriculumStore } from '@/store/useCurriculumStore';

interface SemesterBoundItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PrerequisiteEdge: React.FC<EdgeProps> = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  // Find any semester box that lies between sourceY and targetY, and whose X range overlaps with targetX/sourceX
  const sourceParentId = data?.sourceParentId;
  const targetParentId = data?.targetParentId;
  const semesterBounds: SemesterBoundItem[] = data?.semesterBounds || [];

  // Filter boxes that are between the source and target vertically, and are not the source or target parents
  const obstacles = semesterBounds.filter((box: SemesterBoundItem) => {
    if (box.id === sourceParentId || box.id === targetParentId) return false;
    
    // Check if the box is vertically between the source and target
    const verticalOverlap = box.y > (sourceY + 10) && (box.y + box.h) < (targetY - 10);
    if (!verticalOverlap) return false;

    // Check if the vertical line segment from sourceX to targetX would cross the box horizontally
    const minLineX = Math.min(sourceX, targetX);
    const maxLineX = Math.max(sourceX, targetX);
    const boxLeft = box.x;
    const boxRight = box.x + box.w;

    // Line overlaps box horizontally if the intervals overlap
    const horizontalOverlap = !(maxLineX < boxLeft || minLineX > boxRight);
    return horizontalOverlap;
  });

  let edgePath = '';

  if (obstacles.length > 0) {
    // Find the combined horizontal boundaries of all obstacles
    let minObsX = Infinity;
    let maxObsX = -Infinity;
    let maxObsY = -Infinity;
    obstacles.forEach((box: SemesterBoundItem) => {
      minObsX = Math.min(minObsX, box.x);
      maxObsX = Math.max(maxObsX, box.x + box.w);
      maxObsY = Math.max(maxObsY, box.y + box.h);
    });

    // Choose the detour side (left or right) based on which is closer to sourceX
    const distToLeft = Math.abs(sourceX - minObsX);
    const distToRight = Math.abs(sourceX - maxObsX);
    
    // Set detour X with 40px clearance
    const detourX = distToLeft < distToRight ? minObsX - 40 : maxObsX + 40;
    
    // Step down within the source container
    const yStep1 = sourceY + 30;
    // Step down below all obstacles
    const yStep2 = maxObsY + 30;

    edgePath = `M ${sourceX} ${sourceY} L ${sourceX} ${yStep1} L ${detourX} ${yStep1} L ${detourX} ${yStep2} L ${targetX} ${yStep2} L ${targetX} ${targetY}`;
  } else {
    const [path] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    edgePath = path;
  }

  const setSelectedCourseId = useCurriculumStore((state) => state.setSelectedCourseId);
  const selectedSemester = useCurriculumStore((state) => state.selectedSemester);
  const setSelectedSemester = useCurriculumStore((state) => state.setSelectedSemester);

  // Calculate stacked vertical offsets to prevent overlaps above/below the course card
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
        d={edgePath}
        markerEnd={markerEnd}
      />
      {data?.showPrereqLabel && data?.sourceCourseName && (
        <EdgeLabelRenderer>
          <div
            onClick={handlePrereqClick}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${targetX}px, ${targetY - verticalOffsetPrereq}px)`,
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
              transform: `translate(-50%, 0%) translate(${sourceX}px, ${sourceY + verticalOffsetSuccessor}px)`,
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
