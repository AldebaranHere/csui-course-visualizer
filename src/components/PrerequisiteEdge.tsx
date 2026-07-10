import React from 'react';
import { EdgeProps, EdgeLabelRenderer, useStore } from 'reactflow';
import { useCurriculumStore } from '@/store/useCurriculumStore';

interface ObstacleBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const snapToGrid = (x: number) => Math.round(x / 20) * 20;

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
  const nodes = useStore((state) => Array.from(state.nodeInternals.values()));
  const edges = useStore((state) => state.edges);

  const nodeMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    nodes.forEach((n) => {
      map[n.id] = n;
    });
    return map;
  }, [nodes]);

  const semesterBounds = React.useMemo(() => {
    return nodes
      .filter((n) => n.type === 'semesterGroup')
      .map((n) => ({
        id: n.id,
        x: n.position.x,
        y: n.position.y,
        w: Number(n.width || n.style?.width || 320),
        h: Number(n.height || n.style?.height || 480),
      }));
  }, [nodes]);

  const sourceCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    edges.forEach((edge) => {
      counts[edge.source] = (counts[edge.source] || 0) + 1;
    });
    return counts;
  }, [edges]);

  const targetCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    edges.forEach((edge) => {
      counts[edge.target] = (counts[edge.target] || 0) + 1;
    });
    return counts;
  }, [edges]);

  const getSemNumFromY = (y: number) => {
    if (y < 560) return 1;
    if (y < 1120) return 2;
    if (y < 1680) return 3;
    if (y < 2240) return 4;
    return 5 + Math.floor((y - 2240) / 560);
  };

  function getSemNum(parentId?: string) {
    if (!parentId) return 0;
    if (parentId === 'semester-pilihan') return 7;
    const match = parentId.match(/semester-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  // Pre-calculate all node bounds
  const nodeBounds = React.useMemo(() => {
    const bounds: Record<string, ObstacleBox> = {};
    nodes.forEach((node) => {
      if (node.type !== 'course') return;
      const parentNode = node.parentNode ? nodeMap[node.parentNode] : null;
      const parentX = parentNode?.position.x || 0;
      const parentY = parentNode?.position.y || 0;

      const outgoingCount = edges.filter((e) => e.source === node.id).length;
      const maxConn = Math.max(node.data.prerequisites ? node.data.prerequisites.length : 0, outgoingCount);
      const nodeWidth = Math.max(320, maxConn * 40);
      bounds[node.id] = {
        id: node.id,
        x: node.position.x + parentX,
        y: node.position.y + parentY,
        w: nodeWidth,
        h: 110,
      };
    });
    return bounds;
  }, [nodes, edges, nodeMap]);

  const edgeInfos = React.useMemo(() => {
    return edges
      .map((edge) => {
        const sourceNode = nodeMap[edge.source];
        const targetNode = nodeMap[edge.target];
        if (!sourceNode || !targetNode) return null;


        const sIdx = parseInt(edge.sourceHandle?.replace('source-', '') || '0', 10);
        const tIdx = parseInt(edge.targetHandle?.replace('target-', '') || '0', 10);

        const sCount = sourceCounts[edge.source] || 1;
        const tCount = targetCounts[edge.target] || 1;

        const sourceOffset = (sIdx - (sCount - 1) / 2) * 40;
        const targetOffset = (tIdx - (tCount - 1) / 2) * 40;

        const sBounds = nodeBounds[edge.source];
        const tBounds = nodeBounds[edge.target];
        if (!sBounds || !tBounds) return null;

        const sourceXCoord = sBounds.x + sBounds.w / 2 + sourceOffset;
        const sourceYCoord = sBounds.y + sBounds.h;
        const targetXCoord = tBounds.x + tBounds.w / 2 + targetOffset;
        const targetYCoord = tBounds.y;

        const sourceSem = getSemNumFromY(sourceYCoord);
        const targetSem = getSemNumFromY(targetYCoord);

        // Obstacles are intermediate semester groups (container-level) and course cards inside the target semester group
        // ponytail: hybrid container/card routing prevents edges from cutting through non-destination semester containers
        const obstacles: ObstacleBox[] = [];

        // 1. Semester group containers (excluding source and target parent semesters)
        semesterBounds.forEach((box) => {
          if (box.id === sourceNode.parentNode || box.id === targetNode.parentNode) return;
          const verticalOverlap = box.y > sourceYCoord + 5 && box.y < targetYCoord - 5;
          if (!verticalOverlap) return;

          const minLineX = Math.min(sourceXCoord, targetXCoord);
          const maxLineX = Math.max(sourceXCoord, targetXCoord);
          const horizontalOverlap = !(maxLineX < box.x || minLineX > box.x + box.w);
          if (horizontalOverlap) {
            obstacles.push(box);
          }
        });

        // 2. Individual course cards inside the target parent semester group (destination)
        Object.values(nodeBounds).forEach((box) => {
          const courseNode = nodeMap[box.id];
          if (!courseNode || courseNode.parentNode !== targetNode.parentNode) return;
          if (box.id === edge.source || box.id === edge.target) return;
          const verticalOverlap = box.y > sourceYCoord + 5 && box.y < targetYCoord - 5;
          if (!verticalOverlap) return;

          const minLineX = Math.min(sourceXCoord, targetXCoord);
          const maxLineX = Math.max(sourceXCoord, targetXCoord);
          const horizontalOverlap = !(maxLineX < box.x || minLineX > box.x + box.w);
          if (horizontalOverlap) {
            obstacles.push(box);
          }
        });

        // Label obstacle checking: prevent lines from crossing the top-left label area of any group
        semesterBounds.forEach((box) => {
          if (box.id === sourceNode.parentNode || box.id === targetNode.parentNode) return;
          const labelLeft = box.x;
          const labelRight = box.x + 320;
          const labelTop = box.y;
          const labelBottom = box.y + 80;

          const minLineX = Math.min(sourceXCoord, targetXCoord);
          const maxLineX = Math.max(sourceXCoord, targetXCoord);

          const verticalOverlap = labelTop < Math.max(sourceYCoord, targetYCoord) && labelBottom > Math.min(sourceYCoord, targetYCoord);
          const horizontalOverlap = !(maxLineX < labelLeft || minLineX > labelRight);

          if (verticalOverlap && horizontalOverlap) {
            obstacles.push({
              id: box.id,
              x: labelLeft,
              y: labelTop,
              w: 320,
              h: 80,
            });
          }
        });

        let detourSide = 'none';
        let minObsX = Infinity, maxObsX = -Infinity, maxObsY = -Infinity;
        let lastObstacleSem = 0;
        if (obstacles.length > 0) {
          obstacles.forEach((box) => {
            minObsX = Math.min(minObsX, box.x);
            maxObsX = Math.max(maxObsX, box.x + box.w);
            maxObsY = Math.max(maxObsY, box.y + box.h);
            const courseNode = nodeMap[box.id];
            if (courseNode && courseNode.parentNode) {
              const semNum = getSemNum(courseNode.parentNode);
              if (semNum > lastObstacleSem) {
                lastObstacleSem = semNum;
              }
            } else {
              const semNum = getSemNum(box.id);
              if (semNum > lastObstacleSem) {
                lastObstacleSem = semNum;
              }
            }
          });
          lastObstacleSem = Math.min(lastObstacleSem, targetSem - 1);
          const distToLeft = Math.abs(sourceXCoord - minObsX);
          const distToRight = Math.abs(sourceXCoord - maxObsX);
          detourSide = distToLeft < distToRight ? 'left' : 'right';
        }

        return {
          id: edge.id,
          sourceX: sourceXCoord,
          sourceY: sourceYCoord,
          targetX: targetXCoord,
          targetY: targetYCoord,
          sourceSem,
          targetSem,
          obstacles,
          minObsX,
          maxObsX,
          maxObsY,
          detourSide,
          lastObstacleSem,
          sourceParentId: sourceNode.parentNode,
          targetParentId: targetNode.parentNode,
          sourceOffset,
          targetOffset,
          verticalLaneIndex: 0,
        };
      })
      .filter((info): info is NonNullable<typeof info> => info !== null);
  }, [edges, nodeMap, semesterBounds, sourceCounts, targetCounts, nodeBounds]);

  const routingData = React.useMemo(() => {
    if (edgeInfos.length === 0) return null;

    const leftDetours = edgeInfos.filter((info) => info.obstacles.length > 0 && info.detourSide === 'left');
    const rightDetours = edgeInfos.filter((info) => info.obstacles.length > 0 && info.detourSide === 'right');

    const adjustDetourX = (x: number, side: string, sourceParentId: string | null, targetParentId: string | null, sourceY: number, targetY: number) => {
      let adjustedX = x;
      semesterBounds.forEach((box) => {
        if (box.id === sourceParentId || box.id === targetParentId) return;
        const verticalOverlap = box.y > sourceY + 5 && box.y < targetY - 5;
        if (!verticalOverlap) return;

        if (adjustedX > box.x - 20 && adjustedX < box.x + box.w + 20) {
          if (side === 'left') {
            adjustedX = Math.min(adjustedX, box.x - 40);
          } else {
            adjustedX = Math.max(adjustedX, box.x + box.w + 40);
          }
        }
      });
      return snapToGrid(adjustedX);
    };

    function colorVerticalDetours(detours: typeof edgeInfos) {
      const n = detours.length;
      if (n === 0) return;


      const adj: number[][] = Array.from({ length: n }, () => []);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const d1 = detours[i];
          const d2 = detours[j];
          const overlap = Math.max(d1.sourceY, d2.sourceY) < Math.min(d1.targetY, d2.targetY);
          if (overlap) {
            adj[i].push(j);
            adj[j].push(i);
          }
        }
      }

      const colors = new Array(n).fill(-1);
      const indices = Array.from({ length: n }, (_, i) => i);
      indices.sort((i, j) => detours[i].sourceY - detours[j].sourceY);

      indices.forEach((idx) => {
        const d = detours[idx];
        const neighborColors = new Set<number>();
        adj[idx].forEach((neigh) => {
          if (colors[neigh] !== -1) {
            neighborColors.add(colors[neigh]);
          }
        });

        const usedXCoords = new Set<number>();
        edgeInfos.forEach((other) => {
          const overlap = Math.max(d.sourceY, other.sourceY) < Math.min(d.targetY, other.targetY);
          if (overlap) {
            usedXCoords.add(Math.round(other.sourceX));
            usedXCoords.add(Math.round(other.targetX));
          }
        });

        detours.forEach((other, oIdx) => {
          if (colors[oIdx] !== -1 && other.id !== d.id) {
            const overlap = Math.max(d.sourceY, other.sourceY) < Math.min(d.targetY, other.targetY);
            if (overlap) {
              const otherColor = colors[oIdx];
              const rawOtherDetourX = other.detourSide === 'left'
                ? other.minObsX - 40 - otherColor * 20
                : other.maxObsX + 40 + otherColor * 20;
              const otherDetourX = adjustDetourX(
                rawOtherDetourX,
                other.detourSide,
                other.sourceParentId,
                other.targetParentId,
                other.sourceY,
                other.targetY
              );
              usedXCoords.add(Math.round(otherDetourX));
            }
          }
        });

        let c = 0;
        while (true) {
          if (!neighborColors.has(c)) {
            const rawDetourX = d.detourSide === 'left' ? d.minObsX - 40 - c * 20 : d.maxObsX + 40 + c * 20;
            const detourX = adjustDetourX(rawDetourX, d.detourSide, d.sourceParentId, d.targetParentId, d.sourceY, d.targetY);
            if (!usedXCoords.has(Math.round(detourX))) {
              break;
            }
          }
          c++;
        }
        colors[idx] = c;
      });

      detours.forEach((info, i) => {
        info.verticalLaneIndex = colors[i];
      });
    }

    colorVerticalDetours(leftDetours);
    colorVerticalDetours(rightDetours);

    const gapSegments: {
      edgeIdx: number;
      segmentType: 'step1' | 'step2' | 'turn';
      x1: number;
      x2: number;
      detourX?: number;
    }[][] = Array.from({ length: 12 }, () => []);

    edgeInfos.forEach((info, idx) => {
      if (info.obstacles.length > 0) {
        const rawDetourX = info.detourSide === 'left'
          ? info.minObsX - 40 - info.verticalLaneIndex * 20
          : info.maxObsX + 40 + info.verticalLaneIndex * 20;
        const detourX = adjustDetourX(rawDetourX, info.detourSide, info.sourceParentId, info.targetParentId, info.sourceY, info.targetY);

        gapSegments[info.sourceSem].push({
          edgeIdx: idx,
          segmentType: 'step1',
          x1: Math.min(info.sourceX, detourX),
          x2: Math.max(info.sourceX, detourX),
          detourX,
        });

        gapSegments[info.lastObstacleSem || info.sourceSem].push({
          edgeIdx: idx,
          segmentType: 'step2',
          x1: Math.min(detourX, info.targetX),
          x2: Math.max(detourX, info.targetX),
          detourX,
        });
      } else {
        gapSegments[info.sourceSem].push({
          edgeIdx: idx,
          segmentType: 'turn',
          x1: Math.min(info.sourceX, info.targetX),
          x2: Math.max(info.sourceX, info.targetX),
        });
      }
    });

    const segmentYMap: Record<string, number> = {};

    for (let g = 1; g <= 9; g++) {
      const segments = gapSegments[g];
      const m = segments.length;
      if (m === 0) continue;

      const conflicts = Array.from({ length: m }, () => new Set<number>());
      for (let i = 0; i < m; i++) {
        for (let j = i + 1; j < m; j++) {
          const s1 = segments[i];
          const s2 = segments[j];
          const overlap = Math.max(s1.x1, s2.x1) < Math.min(s1.x2, s2.x2);
          if (overlap) {
            conflicts[i].add(j);
            conflicts[j].add(i);
          }
        }
      }

      let colors = new Array(m).fill(-1);
      const snapToGrid = (x: number) => Math.round(x / 20) * 20;
      const semG = semesterBounds.find((b) => b.id === `semester-${g}`);
      const semG1 = semesterBounds.find((b) => b.id === `semester-${g + 1}`);
      const minY = semG ? semG.y + semG.h + 40 : 0;
      const maxY = semG1 ? semG1.y - 40 : minY + 200;
      const availableHeight = maxY - minY;

      let changed = true;
      let iterations = 0;
      while (changed && iterations < 10) {
        changed = false;
        iterations++;

        colors = new Array(m).fill(-1);
        const indices = Array.from({ length: m }, (_, i) => i);
        indices.sort((i, j) => segments[i].x1 - segments[j].x1);

        indices.forEach((idx) => {
          const neighborColors = new Set<number>();
          conflicts[idx].forEach((neigh) => {
            if (colors[neigh] !== -1) {
              neighborColors.add(colors[neigh]);
            }
          });
          let c = 0;
          while (neighborColors.has(c)) {
            c++;
          }
          colors[idx] = c;
        });

        const laneTotal = Math.max(...colors) + 1;
        const spacing = Math.min(20, availableHeight / (laneTotal + 1));

        const currentIntervals = segments.map((seg, i) => {
          const laneIndex = colors[i];
          const rawY = minY + (laneIndex + 1) * spacing;
          const y = spacing >= 20 ? snapToGrid(rawY) : Math.round(rawY);

          let x1 = seg.x1;
          let x2 = seg.x2;
          if (seg.segmentType === 'step1' || seg.segmentType === 'step2') {
            const info = edgeInfos[seg.edgeIdx];
            const detourX = snapToGrid(
              info.detourSide === 'left'
                ? info.minObsX - 40 - info.verticalLaneIndex * 20
                : info.maxObsX + 40 + info.verticalLaneIndex * 20
            );
            if (seg.segmentType === 'step1') {
              x1 = Math.min(info.sourceX, detourX);
              x2 = Math.max(info.sourceX, detourX);
            } else {
              x1 = Math.min(detourX, info.targetX);
              x2 = Math.max(detourX, info.targetX);
            }
          }
          return { x1, x2, y };
        });

        for (let i = 0; i < m; i++) {
          for (let j = i + 1; j < m; j++) {
            if (currentIntervals[i].y === currentIntervals[j].y) {
              const s1 = currentIntervals[i];
              const s2 = currentIntervals[j];
              const overlap = Math.max(s1.x1, s2.x1) < Math.min(s1.x2, s2.x2);
              if (overlap && !conflicts[i].has(j)) {
                conflicts[i].add(j);
                conflicts[j].add(i);
                changed = true;
              }
            }
          }
        }
      }

      const laneTotal = Math.max(...colors) + 1;
      const spacing = Math.min(20, availableHeight / (laneTotal + 1));
      segments.forEach((seg, i) => {
        const laneIndex = colors[i];
        const rawY = minY + (laneIndex + 1) * spacing;
        const y = spacing >= 20 ? snapToGrid(rawY) : Math.round(rawY);
        segmentYMap[`${seg.edgeIdx}_${seg.segmentType}`] = y;
      });
    }

    const pathMap: Record<string, { d: string; sourceX: number; sourceY: number; targetX: number; targetY: number }> = {};
    edgeInfos.forEach((info, idx) => {
      const snapToGrid = (x: number) => Math.round(x / 20) * 20;

      let d = '';
      if (info.obstacles.length > 0) {
        const rawDetourX = info.detourSide === 'left'
          ? info.minObsX - 40 - info.verticalLaneIndex * 20
          : info.maxObsX + 40 + info.verticalLaneIndex * 20;
        const detourX = adjustDetourX(rawDetourX, info.detourSide, info.sourceParentId, info.targetParentId, info.sourceY, info.targetY);

        const yStep1 = segmentYMap[`${idx}_step1`] || (info.sourceY + 40);
        const yStep2 = segmentYMap[`${idx}_step2`] || (info.targetY - 40);

        if (info.id === 'CSCM601213-CSCM603117') {
          (window as any).debugEdge = {
            id: info.id,
            sourceX: info.sourceX,
            sourceY: info.sourceY,
            targetX: info.targetX,
            targetY: info.targetY,
            obstacles: info.obstacles,
            detourSide: info.detourSide,
            detourX,
            yStep1,
            yStep2,
            lastObstacleSem: info.lastObstacleSem
          };
        }

        d = `M ${info.sourceX} ${info.sourceY - 3} L ${info.sourceX} ${yStep1} L ${detourX} ${yStep1} L ${detourX} ${yStep2} L ${info.targetX} ${yStep2} L ${info.targetX} ${info.targetY + 3}`;
      } else {
        const yTurn = segmentYMap[`${idx}_turn`] || ((info.sourceY + info.targetY) / 2);
        d = `M ${info.sourceX} ${info.sourceY - 3} L ${info.sourceX} ${yTurn} L ${info.targetX} ${yTurn} L ${info.targetX} ${info.targetY + 3}`;
      }

      pathMap[info.id] = { d, sourceX: info.sourceX, sourceY: info.sourceY, targetX: info.targetX, targetY: info.targetY };
    });

    return pathMap;
  }, [edgeInfos, semesterBounds, nodeBounds]);

  const activePathInfo = routingData ? routingData[id] : null;
  const path = activePathInfo ? activePathInfo.d : '';
  const calculatedSourceX = activePathInfo ? activePathInfo.sourceX : sourceX;
  const calculatedSourceY = activePathInfo ? activePathInfo.sourceY : sourceY;
  const calculatedTargetX = activePathInfo ? activePathInfo.targetX : targetX;
  const calculatedTargetY = activePathInfo ? activePathInfo.targetY : targetY;

  const setSelectedCourseId = useCurriculumStore((state) => state.setSelectedCourseId);
  const selectedSemester = useCurriculumStore((state) => state.selectedSemester);
  const setSelectedSemester = useCurriculumStore((state) => state.setSelectedSemester);

  const prereqIndex = data?.prereqIndex || 0;
  const verticalOffsetPrereq = 18 + prereqIndex * 20;

  const successorIndex = data?.successorIndex || 0;
  const verticalOffsetSuccessor = 8 + successorIndex * 20;

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
