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
import SemesterGroupNode from './SemesterGroupNode';
import { PrerequisiteEdge } from './PrerequisiteEdge';

// Custom node and edge types mapping
const nodeTypes = {
  course: CourseNode,
  semesterGroup: SemesterGroupNode,
};

const edgeTypes = {
  prerequisite: PrerequisiteEdge,
};

interface CurriculumGraphProps {
  courses: Record<string, Course>;
}

// Helper to determine the recommended semester for a course based on its name and major
const getRecommendedSemester = (course: Course, major: 'CS' | 'IS'): string => {
  if (course.state === 'Pilihan') {
    return 'pilihan';
  }

  const name = course.name.toLowerCase().trim();

  if (major === 'CS') {
    // CS Semester 1
    if (name.includes('mpk') && name.includes('agama')) return '1';
    if (name.includes('mpk') && name.includes('inggris')) return '1';
    if (name.includes('kalkulus 1')) return '1';
    if (name.includes('matematika diskret 1')) return '1';
    if (name.includes('dasar-dasar pemrograman 1')) return '1';
    if (name.includes('sistem digital')) return '1';

    // CS Semester 2
    if (name.includes('mpk') && name.includes('terintegrasi')) return '2';
    if (name.includes('matematika diskret 2')) return '2';
    if (name.includes('dasar-dasar pemrograman 2')) return '2';
    if (name.includes('organisasi komputer') || name.includes('pengantar organisasi komputer')) return '2';
    if (name.includes('kalkulus 2')) return '2';

    // CS Semester 3
    if (name.includes('pemrograman berbasis platform')) return '3';
    if (name.includes('struktur data')) return '3';
    if (name.includes('aljabar linier') || name.includes('aljabar linear')) return '3';
    if (name.includes('sistem operasi')) return '3';
    if (name.includes('statistika & probabilitas') || name.includes('statistika dan probabilitas')) return '3';

    // CS Semester 4
    if (name.includes('basis data')) return '4';
    if (name.includes('sistem interaksi')) return '4';
    if (name.includes('keamanan perangkat lunak') || name.includes('pengantar keamanan perangkat lunak')) return '4';
    if (name.includes('bahasa & automata') || name.includes('bahasa dan automata')) return '4';
    if (name.includes('pemrograman lanjut')) return '4';

    // CS Semester 5
    if (name.includes('sains data dasar') || name.includes('kecerdasan artifisial')) return '5';
    if (name.includes('jaringan komputer')) return '5';
    if (name.includes('analisis numerik')) return '5';
    if (name.includes('desain & analisis algoritma') || name.includes('desain dan analisis algoritma')) return '5';
    if (name.includes('rekayasa perangkat lunak')) return '5';

    // CS Semester 6
    if (name.includes('metodologi penelitian')) return '6';
    if (name.includes('proyek perangkat lunak')) return '6';

    // CS Semester 7
    if (name.includes('komputer & masyarakat') || name.includes('komputer dan masyarakat')) return '7';
    if (name.includes('kerja praktik')) return '7';

    // CS Semester 8
    if (name.includes('tugas akhir') || name.includes('individu') || name.includes('kelompok')) return '8';
  } else {
    // IS Semester 1
    if (name.includes('mpk') && name.includes('agama')) return '1';
    if (name.includes('mpk') && name.includes('inggris')) return '1';
    if (name.includes('kalkulus')) return '1';
    if (name.includes('matematika diskret 1')) return '1';
    if (name.includes('dasar-dasar pemrograman 1')) return '1';
    if (name.includes('manajemen bisnis')) return '1';
    if (name.includes('komunikasi bisnis')) return '1';

    // IS Semester 2
    if (name.includes('mpk') && name.includes('terintegrasi')) return '2';
    if (name.includes('mpkt') || name.includes('terintegrasi')) return '2';
    if (name.includes('dasar-dasar pemrograman 2')) return '2';
    if (name.includes('matematika diskret 2')) return '2';
    if (name.includes('arsitektur komputer') || name.includes('dasar-dasar arsitektur komputer')) return '2';
    if (name.includes('prinsip-prinsip sistem informasi') || name.includes('prinsip sistem informasi')) return '2';

    // IS Semester 3
    if (name.includes('pemrograman berbasis platform')) return '3';
    if (name.includes('struktur data')) return '3';
    if (name.includes('aljabar linier') || name.includes('aljabar linear')) return '3';
    if (name.includes('sistem operasi') || name.includes('pengantar sistem operasi')) return '3';
    if (name.includes('statistika') || name.includes('stat') || name.includes('pengantar statistika')) return '3';

    // IS Semester 4
    if (name.includes('keamanan perangkat lunak') || name.includes('pengantar keamanan perangkat lunak')) return '4';
    if (name.includes('sistem interaksi')) return '4';
    if (name.includes('basis data')) return '4';
    if (name.includes('perusahaan dan akuntansi') || name.includes('sipa')) return '4';
    if (name.includes('manajemen proyek')) return '4';

    // IS Semester 5
    if (name.includes('pemrograman aplikasi perusahaan') || name.includes('apap')) return '5';
    if (name.includes('analisis dan perancangan')) return '5';
    if (name.includes('manajemen sistem informasi')) return '5';
    if (name.includes('jaringan komunikasi')) return '5';

    // IS Semester 6
    if (name.includes('proyek pengembangan') || name.includes('propensi')) return '6';
    if (name.includes('metodologi penelitian')) return '6';
    if (name.includes('sains data dasar') || name.includes('kecerdasan artifisial')) return '6';

    // IS Semester 7
    if (name.includes('komputer dan masyarakat') || name.includes('komputer & masyarakat')) return '7';
    if (name.includes('kerja praktik')) return '7';

    // IS Semester 8
    if (name.includes('tugas akhir') || name.includes('penelitian') || name.includes('kelompok')) return '8';
  }

  return 'pilihan';
};

export const CurriculumGraph: React.FC<CurriculumGraphProps> = ({ courses }) => {
  const activeMajor = useCurriculumStore((state) => state.activeMajor);
  const selectedCourseId = useCurriculumStore((state) => state.selectedCourseId);
  const setSelectedCourseId = useCurriculumStore((state) => state.setSelectedCourseId);
  const searchQuery = useCurriculumStore((state) => state.searchQuery);
  const highlightedNodes = useCurriculumStore((state) => state.highlightedNodes);
  const setHighlightedNodes = useCurriculumStore((state) => state.setHighlightedNodes);
  const selectedSemester = useCurriculumStore((state) => state.selectedSemester);
  const { fitView, setCenter, fitBounds } = useReactFlow();

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
    const dagreGraph = new dagre.graphlib.Graph({ compound: true });
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Configure Dagre layout: Top-to-Bottom, compound layouts, spacious separation
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 160, compound: true });

    const semestersList = ['1', '2', '3', '4', '5', '6', '7', '8', 'pilihan'];
    
    // Initialize semester container parent nodes in Dagre with dynamic size fit padding
    semestersList.forEach((sem) => {
      // Dagre calculates dimensions based on children plus padding
      dagreGraph.setNode(`semester-${sem}`, { padding: 15 });
    });

    const courseList = Object.values(courses);

    // Add child nodes to Dagre & establish parent relationships
    courseList.forEach((course) => {
      dagreGraph.setNode(course.code, { width: 240, height: 120 });
      const sem = getRecommendedSemester(course, activeMajor);
      dagreGraph.setParent(course.code, `semester-${sem}`);
    });

    // Add edges to dagre
    courseList.forEach((course) => {
      if (course.prerequisites) {
        course.prerequisites.forEach((prereq) => {
          if (courses[prereq]) {
            dagreGraph.setEdge(prereq, course.code);
          }
        });
      }
    });

    // Layout Enhancements:
    // 1. Arrange Pilihan (Elective) courses into a square-ish matrix (4 columns) using dummy layout edges
    const pilihanCourses = courseList.filter(c => getRecommendedSemester(c, activeMajor) === 'pilihan');
    const cols = 4;
    for (let i = 0; i < pilihanCourses.length; i++) {
      if (i + cols < pilihanCourses.length) {
        dagreGraph.setEdge(pilihanCourses[i].code, pilihanCourses[i + cols].code);
      }
    }

    // 2. Adjust CS Semester 7 placement closer to Semester 1/6 columns by adding a layout-only dummy edge
    if (activeMajor === 'CS') {
      const pplNode = courseList.find(c => c.name.toLowerCase().includes('proyek perangkat lunak'));
      const kpNode = courseList.find(c => c.name.toLowerCase().includes('kerja praktik'));
      if (pplNode && kpNode) {
        dagreGraph.setEdge(pplNode.code, kpNode.code);
      }
      const mppiNode = courseList.find(c => c.name.toLowerCase().includes('metodologi penelitian'));
      const komasNode = courseList.find(c => c.name.toLowerCase().includes('komputer & masyarakat') || c.name.toLowerCase().includes('komputer dan masyarakat'));
      if (mppiNode && komasNode) {
        dagreGraph.setEdge(mppiNode.code, komasNode.code);
      }
    }

    // Perform layout calculation
    dagre.layout(dagreGraph);

    // Build the React Flow Nodes list
    const flowNodes: Node[] = [];

    const padding = 30;
    const headerHeight = 110;
    const gap = 40;

    // Group and sort courses by semester based on Dagre layout X coordinates to keep optimized horizontal order
    const coursesBySem: Record<string, typeof courseList> = {};
    semestersList.forEach((sem) => {
      coursesBySem[sem] = courseList.filter(c => getRecommendedSemester(c, activeMajor) === sem);
      coursesBySem[sem].sort((a, b) => {
        const nodeA = dagreGraph.node(a.code);
        const nodeB = dagreGraph.node(b.code);
        return (nodeA?.x || 0) - (nodeB?.x || 0);
      });
    });

    // 1. Generate Semester Group Nodes (Backdrop Cards) with tight packed boundaries
    semestersList.forEach((sem) => {
      const semCourses = coursesBySem[sem];
      if (semCourses.length === 0) return;

      let parentWidth = 0;
      let parentHeight = 0;

      if (sem === 'pilihan') {
        const cols = 4;
        const rows = Math.ceil(semCourses.length / cols);
        parentWidth = cols * 240 + (cols - 1) * gap + 2 * padding;
        parentHeight = rows * 120 + (rows - 1) * gap + 2 * padding + headerHeight;
      } else {
        const N = semCourses.length;
        parentWidth = N * 240 + (N - 1) * gap + 2 * padding;
        parentHeight = 120 + 2 * padding + headerHeight;
      }

      // Center container card exactly where Dagre positioned the semester compound node center
      const parentDagreNode = dagreGraph.node(`semester-${sem}`);
      const centerX = parentDagreNode?.x || 0;
      const centerY = parentDagreNode?.y || 0;

      const parentX = centerX - parentWidth / 2;
      const parentY = centerY - parentHeight / 2;

      let label = `Semester ${sem}`;
      if (sem === 'pilihan') {
        label = activeMajor === 'CS' ? 'Pilihan (Semester 6 hingga 8)' : 'Pilihan (Semester 5 hingga 8)';
      }
      flowNodes.push({
        id: `semester-${sem}`,
        type: 'semesterGroup',
        data: { label },
        position: { x: parentX, y: parentY },
        style: {
          width: parentWidth,
          height: parentHeight,
        },
      });
    });

    // 2. Generate Course Nodes (positioned relatively inside manually computed parent coordinates)
    semestersList.forEach((sem) => {
      const semCourses = coursesBySem[sem];
      semCourses.forEach((course, index) => {
        const semNumber = sem === 'pilihan' ? undefined : parseInt(sem, 10);
        const enrichedCourse = {
          ...course,
          recommendedSemester: semNumber,
        };

        let relativeX = 0;
        let relativeY = 0;

        if (sem === 'pilihan') {
          const col = index % 4;
          const row = Math.floor(index / 4);
          relativeX = padding + col * (240 + gap);
          relativeY = padding + headerHeight + row * (120 + gap);
        } else {
          relativeX = padding + index * (240 + gap);
          relativeY = padding + headerHeight;
        }

        flowNodes.push({
          id: course.code,
          type: 'course',
          data: enrichedCourse,
          parentNode: `semester-${sem}`,
          extent: 'parent',
          position: {
            x: relativeX,
            y: relativeY,
          },
        });
      });
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
             
             // Dynamic arrow color logic:
             // 1. When a course is clicked, active relevant arrows stay yellow, others turn grey (#333333).
             // 2. When a semester is selected but no course is clicked, all arrows turn grey.
             // 3. By default (no filter active), all arrows are yellow (#C5A059).
             const isCourseClicked = selectedCourseId !== null;
             const isSemesterSelected = selectedSemester !== null;
             
             let isYellow = false;
             if (isCourseClicked) {
               isYellow = isHighlightedEdge;
             } else if (isSemesterSelected) {
               isYellow = false;
             } else {
               isYellow = true;
             }

             const strokeColor = isYellow ? '#C5A059' : '#333333';
             const strokeWidth = isYellow ? 2.0 : 1.5;
             const opacityValue = isYellow ? 1 : 0.15;

             // Show label on highlighted active paths
             const showLabel = isHighlightedEdge && (selectedCourseId === prereq || selectedCourseId === course.code);

             flowEdges.push({
               id: `${prereq}-${course.code}`,
               source: prereq,
               target: course.code,
               type: 'prerequisite',
               animated: isHighlightedEdge && selectedCourseId === prereq,
               style: {
                 stroke: strokeColor,
                 strokeWidth: strokeWidth,
                 opacity: opacityValue,
                 transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s',
               },
               markerEnd: {
                 type: MarkerType.ArrowClosed,
                 width: 20,
                 height: 20,
                 color: strokeColor,
               },
               data: {
                 showLabel,
                 sourceCourseName: courses[prereq]?.name || prereq,
                 prereqIndex: course.prerequisites.indexOf(prereq),
               },
             });
          }
        });
      }
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [courses, highlightedNodes, selectedCourseId, selectedSemester, activeMajor]);

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
      if (selectedNode && selectedNode.parentNode) {
        // Find parent group coordinates to map relative back to absolute layout space
        const parentNode = nodes.find((n) => n.id === selectedNode.parentNode);
        if (parentNode) {
          const absoluteX = selectedNode.position.x + parentNode.position.x + 120;
          const absoluteY = selectedNode.position.y + parentNode.position.y + 60;
          setCenter(absoluteX, absoluteY, { zoom: 1.1, duration: 800 });
        }
      }
    }
  }, [selectedCourseId, nodes, setCenter]);

  // Zoom/fit bounds of the selected semester group node when selectedSemester changes
  useEffect(() => {
    if (selectedSemester) {
      const groupNode = nodes.find((n) => n.id === `semester-${selectedSemester}`);
      if (groupNode && groupNode.style?.width && groupNode.style?.height) {
        fitBounds(
          {
            x: groupNode.position.x - 320,
            y: groupNode.position.y,
            width: Number(groupNode.style.width) + 320,
            height: Number(groupNode.style.height),
          },
          { duration: 800, padding: 0.25 }
        );
      }
    } else {
      fitView({ duration: 800, padding: 0.2 });
    }
  }, [selectedSemester, nodes, fitBounds, fitView]);

  return (
    <div className="w-full h-full bg-[#111111] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
