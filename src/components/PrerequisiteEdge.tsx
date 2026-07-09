import React from 'react';
import { EdgeProps, EdgeLabelRenderer } from 'reactflow';
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
  style = {},
  markerEnd,
  data,
}) => {
  const sourceIndex = data?.sourceIndex || 0;
  const sourceTotal = data?.sourceTotal || 1;
  const targetIndex = data?.targetIndex || 0;
  const targetTotal = data?.targetTotal || 1;

  // Snap any X coordinate to the background grid dots (gap = 20)
  const snapToGrid = (x: number) => Math.round(x / 20) * 20;

  // Buffer of exactly 40 pixels (two background grid dots) to snap lines on every second dot column
  const sourceOffset = (sourceIndex - (sourceTotal - 1) / 2) * 40;
  const targetOffset = (targetIndex - (targetTotal - 1) / 2) * 40;

  const adjustedSourceX = sourceX;
  const adjustedTargetX = targetX;

  // Find any semester box that lies between sourceY and targetY, and whose X range overlaps with targetX/sourceX
  const sourceParentId = data?.sourceParentId;
  const targetParentId = data?.targetParentId;
  const semesterBounds: SemesterBoundItem[] = data?.semesterBounds || [];

  // Filter boxes that are between the source and target vertically, and are not the source or target parents
  const obstacles = semesterBounds.filter((box: SemesterBoundItem) => {
    if (box.id === sourceParentId || box.id === targetParentId) return false;
    
    // Check if the box is vertically between the source and target
    const verticalOverlap = box.y > (sourceY + 10) && box.y < (targetY - 10);
    if (!verticalOverlap) return false;

    // Check if the vertical line segment from adjustedSourceX to adjustedTargetX would cross the box horizontally
    const minLineX = Math.min(adjustedSourceX, adjustedTargetX);
    const maxLineX = Math.max(adjustedSourceX, adjustedTargetX);
    const boxLeft = box.x;
    const boxRight = box.x + box.w;

    // Line overlaps box horizontally if the intervals overlap
    const horizontalOverlap = !(maxLineX < boxLeft || minLineX > boxRight);
    return horizontalOverlap;
  });

  // Label obstacle checking: prevent lines from crossing the top-left label area of any group
  semesterBounds.forEach((box: SemesterBoundItem) => {
    if (box.id === sourceParentId || box.id === targetParentId) return;

    // Label region width: 320px, height: 80px from top-left of the group container
    const labelLeft = box.x;
    const labelRight = box.x + 320;
    const labelTop = box.y;
    const labelBottom = box.y + 80;

    const minLineX = Math.min(adjustedSourceX, adjustedTargetX);
    const maxLineX = Math.max(adjustedSourceX, adjustedTargetX);

    const verticalOverlap = labelTop < Math.max(sourceY, targetY) && labelBottom > Math.min(sourceY, targetY);
    const horizontalOverlap = !(maxLineX < labelLeft || minLineX > labelRight);

    if (verticalOverlap && horizontalOverlap) {
      if (!obstacles.some((o) => o.id === box.id)) {
        obstacles.push(box);
      }
    }
  });

  const avoidContainersY = (yVal: number, x1: number, x2: number) => {
    let adjustedY = yVal;
    let iterations = 0;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);

    while (iterations < 5) {
      let resolved = true;
      for (const box of semesterBounds) {
        if (box.id === sourceParentId || box.id === targetParentId) continue;

        // Only avoid if there is horizontal overlap between the line segment and container
        const boxLeft = box.x;
        const boxRight = box.x + box.w;
        const horizontalOverlap = !(maxX < boxLeft || minX > boxRight);
        if (!horizontalOverlap) continue;

        if (adjustedY > box.y - 10 && adjustedY < box.y + box.h + 10) {
          resolved = false;
          const distToTop = Math.abs(adjustedY - (box.y - 30));
          const distToBottom = Math.abs(adjustedY - (box.y + box.h + 30));
          if (distToTop < distToBottom) {
            adjustedY = snapToGrid(box.y - 30);
          } else {
            adjustedY = snapToGrid(box.y + box.h + 30);
          }
          break;
        }
      }
      if (resolved) break;
      iterations++;
    }
    return adjustedY;
  };

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

    // Choose the detour side (left or right) based on which is closer to adjustedSourceX
    const distToLeft = Math.abs(adjustedSourceX - minObsX);
    const distToRight = Math.abs(adjustedSourceX - maxObsX);
    
    // Set detour X with 40px clearance and add detour offset expanding outward
    const detourOffset = Math.abs((sourceOffset + targetOffset) / 2);
    const detourX = snapToGrid(
      distToLeft < distToRight 
        ? minObsX - 40 - detourOffset 
        : maxObsX + 40 + detourOffset
    );
    
    // Step down within the source container, capped to be below sourceY and above targetY
    const yStep1 = avoidContainersY(snapToGrid(Math.min(Math.max(sourceY + 30 + sourceOffset, sourceY + 40), targetY - 40)), adjustedSourceX, detourX);
    // Step down below all obstacles, capped to be below sourceY and above targetY
    const yStep2 = avoidContainersY(snapToGrid(Math.min(Math.max(maxObsY + 30 + targetOffset, sourceY + 40), targetY - 40)), detourX, adjustedTargetX);

    edgePath = `M ${adjustedSourceX} ${sourceY - 3} L ${adjustedSourceX} ${yStep1} L ${detourX} ${yStep1} L ${detourX} ${yStep2} L ${adjustedTargetX} ${yStep2} L ${adjustedTargetX} ${targetY + 3}`;
  } else {
    // Custom clean step path with horizontal turn, capped to be below sourceY and above targetY
    const midY = (sourceY + targetY) / 2;
    const yTurn = avoidContainersY(snapToGrid(Math.min(Math.max(midY + sourceOffset + targetOffset, sourceY + 40), targetY - 40)), adjustedSourceX, adjustedTargetX);
    edgePath = `M ${adjustedSourceX} ${sourceY - 3} L ${adjustedSourceX} ${yTurn} L ${adjustedTargetX} ${yTurn} L ${adjustedTargetX} ${targetY + 3}`;
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
              transform: `translate(-50%, -100%) translate(${adjustedTargetX}px, ${targetY - verticalOffsetPrereq}px)`,
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
              transform: `translate(-50%, 0%) translate(${adjustedSourceX}px, ${sourceY + verticalOffsetSuccessor}px)`,
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
