import React, { useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Edge,
  Node,
  MarkerType,
  useReactFlow,
} from 'reactflow';
import dagre from '@dagrejs/dagre';
import Fuse from 'fuse.js';

import 'reactflow/dist/style.css';
import { useCurriculumStore } from '@/store/useCurriculumStore';
import { Course } from '@/types/curriculum';
import CourseNode from './CourseNode';

// Custom node types mapping
const nodeTypes = {
  course: CourseNode,
};

interface CurriculumGraphProps {
  courses: Record<string, Course>;
}

export const CurriculumGraph: React.FC<CurriculumGraphProps> = ({ courses }) => {
  const activeMajor = useCurriculumStore((state) => state.activeMajor);
  const selectedCourseId = useCurriculumStore((state) => state.selectedCourseId);
  const setSelectedCourseId = useCurriculumStore((state) => state.setSelectedCourseId);
  const searchQuery = useCurriculumStore((state) => state.searchQuery);
  const highlightedNodes = useCurriculumStore((state) => state.highlightedNodes);
  const setHighlightedNodes = useCurriculumStore((state) => state.setHighlightedNodes);
  const { fitView, setCenter } = useReactFlow();

  // 1. Calculate matching and dependency paths
  useEffect(() => {
    // If a specific course is selected, highlight its prerequisite path and descendants
    if (selectedCourseId && courses[selectedCourseId]) {
      const getPrerequisites = (code: string, visited = new Set<string>()): Set<string> => {
        if (visited.has(code)) return visited;
        visited.add(code);
        const c = courses[code];
        if (c && c.prerequisites) {
          c.prerequisites.forEach((p) => getPrerequisites(p, visited));
        }
        return visited;
      };

      const getSuccessors = (code: string, visited = new Set<string>()): Set<string> => {
        if (visited.has(code)) return visited;
        visited.add(code);
        Object.values(courses).forEach((c) => {
          if (c.prerequisites && c.prerequisites.includes(code)) {
            getSuccessors(c.code, visited);
          }
        });
        return visited;
      };

      const activeSet = new Set<string>();
      getPrerequisites(selectedCourseId).forEach((p) => activeSet.add(p));
      getSuccessors(selectedCourseId).forEach((s) => activeSet.add(s));
      setHighlightedNodes(activeSet);
      return;
    }

    // If search query is active, filter using Fuse.js
    if (searchQuery.trim().length > 0) {
      const fuse = new Fuse(Object.values(courses), {
        keys: ['code', 'name', 'topics', 'description'],
        threshold: 0.3,
      });
      const results = fuse.search(searchQuery);
      const activeSet = new Set(results.map((r) => r.item.code));
      setHighlightedNodes(activeSet);
      return;
    }

    // Default: clear highlights
    setHighlightedNodes(new Set());
  }, [selectedCourseId, searchQuery, courses, setHighlightedNodes]);

  // 2. Generate laid-out React Flow Nodes and Edges using Dagre
  const { nodes, edges } = useMemo(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Configure Dagre layout: Top-to-Bottom, node spacing, rank spacing
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 90, ranksep: 140 });

    const courseList = Object.values(courses);

    // Add nodes to dagre
    courseList.forEach((course) => {
      dagreGraph.setNode(course.code, { width: 240, height: 100 });
    });

    // Add edges to dagre
    courseList.forEach((course) => {
      if (course.prerequisites) {
        course.prerequisites.forEach((prereq) => {
          // Prerequisite connects to current course
          if (courses[prereq]) {
            dagreGraph.setEdge(prereq, course.code);
          }
        });
      }
    });

    // Perform layout calculation
    dagre.layout(dagreGraph);

    // Map to React Flow Nodes
    const flowNodes: Node[] = courseList.map((course) => {
      const dagreNode = dagreGraph.node(course.code);
      return {
        id: course.code,
        type: 'course',
        data: course,
        position: {
          x: dagreNode.x - 120, // Center alignment offset (width / 2)
          y: dagreNode.y - 50,  // Center alignment offset (height / 2)
        },
      };
    });

    // Map to React Flow Edges
    const flowEdges: Edge[] = [];
    courseList.forEach((course) => {
      if (course.prerequisites) {
        course.prerequisites.forEach((prereq) => {
          if (courses[prereq]) {
            // Check if both source and target are in the highlighted set
            const hasHighlight = highlightedNodes.size > 0;
            const isSourceActive = !hasHighlight || highlightedNodes.has(prereq);
            const isTargetActive = !hasHighlight || highlightedNodes.has(course.code);
            const isHighlightedEdge = hasHighlight && isSourceActive && isTargetActive;

            flowEdges.push({
              id: `${prereq}-${course.code}`,
              source: prereq,
              target: course.code,
              type: 'smoothstep',
              animated: isHighlightedEdge && selectedCourseId === prereq,
              style: {
                stroke: isHighlightedEdge ? '#C5A059' : '#333333',
                strokeWidth: isHighlightedEdge ? 2.5 : 1.5,
                opacity: hasHighlight && !isHighlightedEdge ? 0.15 : 1,
                transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: isHighlightedEdge ? '#C5A059' : '#333333',
              },
            });
          }
        });
      }
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [courses, highlightedNodes, selectedCourseId]);

  // Fit view when major changes
  useEffect(() => {
    setTimeout(() => {
      fitView({ duration: 800, padding: 0.2 });
    }, 100);
  }, [activeMajor, fitView]);

  // Zoom into selected node when selectedCourseId changes
  useEffect(() => {
    if (selectedCourseId) {
      const selectedNode = nodes.find((n) => n.id === selectedCourseId);
      if (selectedNode) {
        // Center of the node (240x100)
        const x = selectedNode.position.x + 120;
        const y = selectedNode.position.y + 50;
        setCenter(x, y, { zoom: 1.1, duration: 800 });
      }
    }
  }, [selectedCourseId, nodes, setCenter]);

  return (
    <div className="w-full h-full bg-[#111111] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onPaneClick={() => setSelectedCourseId(null)}
        fitView
        onlyRenderVisibleElements={true}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="text-[#F8FAFC]"
      >
        <Background color="#333333" gap={20} size={1} />
        <Controls
          className="!bg-[#1E1E1E] !border-[#333333] !shadow-none [&_button]:!bg-[#1E1E1E] [&_button]:!border-[#333333] [&_button]:!text-[#E2E8F0] [&_button:hover]:!bg-[#333333] [&_svg]:!fill-current"
        />
        <MiniMap
          nodeColor="#1E1E1E"
          maskColor="rgba(17, 17, 17, 0.7)"
          className="!bg-[#1E1E1E] !border-[#333333]"
        />
      </ReactFlow>
    </div>
  );
};
