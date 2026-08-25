'use client';

import React, { useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  useReactFlow,
  Position,
  getSmoothStepPath,
} from 'reactflow';
import dagre from '@dagrejs/dagre';
import Fuse from 'fuse.js';

import 'reactflow/dist/style.css';
import { useCurriculumStore } from '@/store/useCurriculumStore';
import { Course, StudyProgram } from '@/types/curriculum';
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

// Helper to determine the recommended semester/group for a course based on its name and active program
const getRecommendedSemester = (course: Course, program: StudyProgram): string => {
  if (program === 'AI') {
    return course.category || 'Mata Kuliah Pilihan';
  }

  if (course.state === 'Pilihan') {
    return 'pilihan';
  }

  if (program === 'CS_KKI') {
    const code = course.code;
    if (['CSGE601012', 'CSGE601010', 'CSGE602012', 'CSGE601020', 'CSCM601150'].includes(code)) return '1';
    if (['CSCM601213', 'CSGE601011', 'CSGE601021', 'CSGE602040', 'CSCM601252'].includes(code)) return '2';
    if (['CSGE602022', 'CSCM602241', 'CSCM602013', 'CSGE602070', 'CSCM602055'].includes(code)) return '3';
    if (['CSCM603142', 'CSCM602223', 'CSCM603125', 'CSCM603154', 'CSGE603130'].includes(code)) return '4';
    if (['CSGE602024', 'CSGE603091', 'CSCM603117', 'CSCM603228', 'CSGE614093'].includes(code)) return '5';
    return 'pilihan';
  }

  const name = course.name.toLowerCase().trim();
  const isCS = program === 'CS';

  if (isCS) {
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
  const activeProgram = useCurriculumStore((state) => state.activeProgram);
  const selectedCourseId = useCurriculumStore((state) => state.selectedCourseId);
  const setSelectedCourseId = useCurriculumStore((state) => state.setSelectedCourseId);
  const searchQuery = useCurriculumStore((state) => state.searchQuery);
  const highlightedNodes = useCurriculumStore((state) => state.highlightedNodes);
  const setHighlightedNodes = useCurriculumStore((state) => state.setHighlightedNodes);
  const selectedSemester = useCurriculumStore((state) => state.selectedSemester);
  const { fitView, setCenter, fitBounds } = useReactFlow();

  // Intercept empty dataset for IS KKI to show empty state alert
  const isDataEmpty = Object.keys(courses).length === 0;

  // 1. Calculate matching and dependency paths
  useEffect(() => {
    if (isDataEmpty) return;

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
  }, [selectedCourseId, searchQuery, courses, setHighlightedNodes, isDataEmpty]);

  // 2. Generate laid-out React Flow Nodes and Edges using Dagre
  const { nodes, edges } = useMemo(() => {
    if (isDataEmpty) {
      return { nodes: [], edges: [] };
    }

    const dagreGraph = new dagre.graphlib.Graph({ compound: true });
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Configure Dagre layout: Top-to-Bottom, compound layouts, spacious separation
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 160, compound: true });

    const isAI = activeProgram === 'AI';

    // Pre-calculate successor counts (how many courses require each course)
    const successorCounts: Record<string, number> = {};
    Object.values(courses).forEach((c) => {
      if (c.prerequisites) {
        c.prerequisites.forEach((prereq) => {
          successorCounts[prereq] = (successorCounts[prereq] || 0) + 1;
        });
      }
    });

    const getCourseCardWidth = (courseCode: string) => {
      const c = courses[courseCode];
      if (!c) return 320;
      const outgoingCount = successorCounts[courseCode] || 0;
      const prereqCount = c.prerequisites ? c.prerequisites.length : 0;
      const maxConn = Math.max(prereqCount, outgoingCount);
      return Math.max(320, maxConn * 40);
    };

    const semestersList = isAI
      ? [
          'MATHEMATICAL FOUNDATIONS',
          'AI MODELING AND ETHICS',
          'PROGRAMMING FOUNDATIONS',
          'DATA, SYSTEMS, AND SOLUTION DEVELOPMENT',
          'GENERAL REQUIREMENTS & UNDERGRADUATE RESEARCH',
          'Mata Kuliah Pilihan'
        ]
      : ['1', '2', '3', '4', '5', '6', '7', '8', 'pilihan'];
    
    // Initialize container parent nodes in Dagre with dynamic size fit padding
    semestersList.forEach((sem) => {
      dagreGraph.setNode(`semester-${sem}`, { padding: 15 });
    });

    const courseList = Object.values(courses);

    // Add child nodes to Dagre & establish parent relationships
    courseList.forEach((course) => {
      const w = getCourseCardWidth(course.code);
      dagreGraph.setNode(course.code, { width: w, height: 80 });
      const sem = getRecommendedSemester(course, activeProgram);
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
    const pilihanCategory = isAI ? 'Mata Kuliah Pilihan' : 'pilihan';
    const pilihanCourses = courseList.filter(c => getRecommendedSemester(c, activeProgram) === pilihanCategory);
    const cols = 4;
    for (let i = 0; i < pilihanCourses.length; i++) {
      if (i + cols < pilihanCourses.length) {
        dagreGraph.setEdge(pilihanCourses[i].code, pilihanCourses[i + cols].code);
      }
    }

    // 2. Adjust CS/CS_KKI Semester 7 placement closer to Semester 1/6 columns by adding layout-only dummy edges
    const isCS = activeProgram === 'CS' || activeProgram === 'CS_KKI';
    if (isCS) {
      const pplNode = courseList.find(c => c.name.toLowerCase().includes('proyek perangkat lunak') || c.name.toLowerCase().includes('software project'));
      const kpNode = courseList.find(c => c.name.toLowerCase().includes('kerja praktik') || c.name.toLowerCase().includes('internship'));
      if (pplNode && kpNode) {
        dagreGraph.setEdge(pplNode.code, kpNode.code);
      }
      const mppiNode = courseList.find(c => c.name.toLowerCase().includes('metodologi penelitian') || c.name.toLowerCase().includes('scientific writing & research methodology'));
      const komasNode = courseList.find(c => c.name.toLowerCase().includes('komputer & masyarakat') || c.name.toLowerCase().includes('computer & society'));
      if (mppiNode && komasNode) {
        dagreGraph.setEdge(mppiNode.code, komasNode.code);
      }
    }

    // 3. Align IS/IS_KKI Semester 7 (Kerja Praktik) exactly to the left of Semester 8 (Tugas Akhir)
    const isIS = activeProgram === 'IS' || activeProgram === 'IS_KKI';
    if (isIS) {
      const propensiNode = courseList.find(c => c.name.toLowerCase().includes('proyek pengembangan') || c.name.toLowerCase().includes('propensi') || c.name.toLowerCase().includes('information systems development project'));
      const kpNode = courseList.find(c => c.name.toLowerCase().includes('kerja praktik') || c.name.toLowerCase().includes('internship'));
      const taNode = courseList.find(c => c.name.toLowerCase().includes('tugas akhir') || c.name.toLowerCase().includes('thesis') || c.name.toLowerCase().includes('undergraduate thesis'));
      if (propensiNode && kpNode && taNode) {
        dagreGraph.setEdge(propensiNode.code, kpNode.code);
        dagreGraph.setEdge(propensiNode.code, taNode.code);
      }
    }

    // Perform layout calculation
    dagre.layout(dagreGraph);

    // Build the React Flow Nodes list
    const flowNodes: Node[] = [];

    const padding = 30;
    const headerHeight = 40;
    const gap = 40;

    // Group and sort courses by semester based on Dagre layout X coordinates to keep optimized horizontal order
    const coursesBySem: Record<string, typeof courseList> = {};
    semestersList.forEach((sem) => {
      coursesBySem[sem] = courseList.filter(c => getRecommendedSemester(c, activeProgram) === sem);
      coursesBySem[sem].sort((a, b) => {
        const nodeA = dagreGraph.node(a.code);
        const nodeB = dagreGraph.node(b.code);
        return (nodeA?.x || 0) - (nodeB?.x || 0);
      });
    });

    interface SemesterBoundItem {
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }
    const semesterBounds: SemesterBoundItem[] = [];

    // Pre-calculate the Pilihan group's X and Y coordinates to align Semesters 6, 7, and 8 exactly to its left and top
    let pilihanLeftX = 0;
    let pilihanTopY = 0;
    const sem6Height = 80 + 2 * padding + headerHeight;
    const pilihanDagreNode = dagreGraph.node(`semester-${pilihanCategory}`);
    if (pilihanDagreNode) {
      const semCourses = coursesBySem[pilihanCategory] || [];
      const rows = Math.ceil(semCourses.length / cols);
      const colWidths = Array(cols).fill(320);
      semCourses.forEach((c, idx) => {
        const colIdx = idx % cols;
        const w = getCourseCardWidth(c.code);
        if (w > colWidths[colIdx]) {
          colWidths[colIdx] = w;
        }
      });
      const totalColWidth = colWidths.reduce((sum, w) => sum + w, 0);
      const pilihanWidth = totalColWidth + (cols - 1) * gap + 2 * padding;
      const pilihanHeight = rows * 80 + (rows - 1) * gap + 2 * padding + headerHeight;
      const pilihanCenterX = pilihanDagreNode.x;
      const pilihanCenterY = pilihanDagreNode.y;
      pilihanLeftX = pilihanCenterX - pilihanWidth / 2;
      pilihanTopY = pilihanCenterY - pilihanHeight / 2;
    }

    // Pre-calculate Semester 7 and 8 widths to position them side-by-side under Semester 6
    const getSemesterWidth = (semKey: string) => {
      const semCourses = coursesBySem[semKey] || [];
      if (semCourses.length === 0) return 0;
      let totalWidth = 0;
      semCourses.forEach((c) => {
        totalWidth += getCourseCardWidth(c.code);
      });
      return totalWidth + (semCourses.length - 1) * gap + 2 * padding;
    };
    const sem7Width = getSemesterWidth('7');
    const sem8Width = getSemesterWidth('8');

    // Calculate dynamic column widths for AI grid (2x3 grid of 6 semester groups)
    const aiColWidths = [0, 0, 0];
    if (isAI) {
      semestersList.forEach((semName, idx) => {
        const colIdx = idx % 3;
        const semCourses = coursesBySem[semName] || [];
        if (semCourses.length === 0) return;
        
        let w = 0;
        if (isAI || semName === 'pilihan') {
          const colWidths = Array(cols).fill(320);
          semCourses.forEach((c, cIdx) => {
            const colIdx = cIdx % cols;
            const cardW = getCourseCardWidth(c.code);
            if (cardW > colWidths[colIdx]) {
              colWidths[colIdx] = cardW;
            }
          });
          const totalColWidth = colWidths.reduce((sum, cw) => sum + cw, 0);
          w = totalColWidth + (cols - 1) * gap + 2 * padding;
        } else {
          w = getSemesterWidth(semName);
        }
        
        if (w > aiColWidths[colIdx]) {
          aiColWidths[colIdx] = w;
        }
      });
    }

    // 1. Generate Semester Group Nodes (Backdrop Cards) with tight packed boundaries
    semestersList.forEach((sem) => {
      const semCourses = coursesBySem[sem];
      if (semCourses.length === 0) return;

      let parentWidth = 0;
      let parentHeight = 0;

      // Group layout logic: AI categories and Pilihan use 4-column matrix grids, others use single horizontal rows
      if (isAI || sem === 'pilihan') {
        const rows = Math.ceil(semCourses.length / cols);
        const colWidths = Array(cols).fill(320);
        semCourses.forEach((c, idx) => {
          const colIdx = idx % cols;
          const w = getCourseCardWidth(c.code);
          if (w > colWidths[colIdx]) {
            colWidths[colIdx] = w;
          }
        });
        const totalColWidth = colWidths.reduce((sum, w) => sum + w, 0);
        parentWidth = totalColWidth + (cols - 1) * gap + 2 * padding;
        parentHeight = rows * 80 + (rows - 1) * gap + 2 * padding + headerHeight;
      } else {
        parentWidth = getSemesterWidth(sem);
        parentHeight = 80 + 2 * padding + headerHeight;
      }

      // Center container card exactly where Dagre positioned the semester compound node center
      const parentDagreNode = dagreGraph.node(`semester-${sem}`);
      const centerX = parentDagreNode?.x || 0;
      const centerY = parentDagreNode?.y || 0;

      let parentX = centerX - parentWidth / 2;
      let parentY = centerY - parentHeight / 2;

      // Layout override for AI categories: arrange in a 2x3 grid
      if (isAI) {
        const catIndex = semestersList.indexOf(sem);
        const col = catIndex % 3;
        const row = Math.floor(catIndex / 3);
        const colGap = 80;
        const rowGap = 120;
        const row0MaxHeight = 450;

        let accumulatedX = 0;
        for (let i = 0; i < col; i++) {
          accumulatedX += aiColWidths[i] + colGap;
        }

        parentX = accumulatedX;
        parentY = row === 0 ? 0 : row0MaxHeight + rowGap;
      }

      // Layout override: Position Semesters 6, 7, and 8 exactly to the left and top-aligned of the Pilihan group
      if (isCS || isIS) {
        if (sem === '6') {
          parentX = pilihanLeftX - parentWidth - 80;
          parentY = pilihanTopY;
        } else if (sem === '8') {
          parentX = pilihanLeftX - sem8Width - 80;
          parentY = pilihanTopY + sem6Height + 160;
        } else if (sem === '7') {
          parentX = pilihanLeftX - sem8Width - 80 - sem7Width - 80;
          parentY = pilihanTopY + sem6Height + 160;
        }
      }

      semesterBounds.push({
        id: `semester-${sem}`,
        x: parentX,
        y: parentY,
        w: parentWidth,
        h: parentHeight,
      });

      let label = `Semester ${sem}`;
      if (sem === 'pilihan') {
        label = isCS ? 'Pilihan (Semester 6 hingga 8)' : 'Pilihan (Semester 5 hingga 8)';
      } else if (isAI) {
        label = sem;
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
    const nodeCoords: Record<string, { x: number; y: number; width: number; height: number; parentNode: string }> = {};
    semestersList.forEach((sem) => {
      const semCourses = coursesBySem[sem];
      semCourses.forEach((course, index) => {
        const semNumber = (sem === 'pilihan' || isAI) ? undefined : parseInt(sem, 10);
        const enrichedCourse = {
          ...course,
          recommendedSemester: semNumber,
          outgoingCount: successorCounts[course.code] || 0,
        };

        let relativeX = 0;
        let relativeY = 0;

        // Positioning logic matching the group shapes
        if (isAI || sem === 'pilihan') {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const colWidths = Array(cols).fill(320);
          semCourses.forEach((c, idx) => {
            const colIdx = idx % cols;
            const w = getCourseCardWidth(c.code);
            if (w > colWidths[colIdx]) {
              colWidths[colIdx] = w;
            }
          });
          let accumulatedX = padding;
          for (let i = 0; i < col; i++) {
            accumulatedX += colWidths[i] + gap;
          }
          relativeX = accumulatedX;
          relativeY = padding + headerHeight + row * (80 + gap);
        } else {
          let accumulatedX = padding;
          for (let i = 0; i < index; i++) {
            accumulatedX += getCourseCardWidth(semCourses[i].code) + gap;
          }
          relativeX = accumulatedX;
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

        nodeCoords[course.code] = {
          x: relativeX,
          y: relativeY,
          width: getCourseCardWidth(course.code),
          height: 80,
          parentNode: `semester-${sem}`,
        };
      });
    });

    const semesterAbsoluteCoords: Record<string, { x: number; y: number }> = {};
    semesterBounds.forEach((bound) => {
      semesterAbsoluteCoords[bound.id] = { x: bound.x, y: bound.y };
    });

    const getAbsoluteCoords = (courseCode: string) => {
      const coords = nodeCoords[courseCode];
      if (!coords) return { x: 0, y: 0, width: 240, height: 80 };
      const parent = semesterAbsoluteCoords[coords.parentNode];
      return {
        x: (parent?.x || 0) + coords.x,
        y: (parent?.y || 0) + coords.y,
        width: coords.width,
        height: coords.height,
      };
    };

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

             const showPrereqLabel = isHighlightedEdge && selectedCourseId === course.code;
             const showSuccessorLabel = isHighlightedEdge && selectedCourseId === prereq;

             const successors = courseList
               .filter((c) => c.prerequisites && c.prerequisites.includes(prereq))
               .map((c) => c.code)
               .sort();
             const successorIndex = successors.indexOf(course.code);
             const prereqIndex = course.prerequisites.indexOf(prereq);

             const sAbs = getAbsoluteCoords(prereq);
             const tAbs = getAbsoluteCoords(course.code);

             const sourceTotal = successors.length;
             const sourceOffset = (successorIndex - (sourceTotal - 1) / 2) * 40;
             const targetTotal = course.prerequisites.length;
             const targetOffset = (prereqIndex - (targetTotal - 1) / 2) * 40;

             const sourceXVal = sAbs.x + sAbs.width / 2 + sourceOffset;
             const sourceYVal = sAbs.y + sAbs.height;
             const targetXVal = tAbs.x + tAbs.width / 2 + targetOffset;
             const targetYVal = tAbs.y;

             const obstacles = semesterBounds.filter((box: SemesterBoundItem) => {
               if (box.id === nodeCoords[prereq]?.parentNode || box.id === nodeCoords[course.code]?.parentNode) return false;
               const verticalOverlap = box.y > (sourceYVal + 10) && (box.y + box.h) < (targetYVal - 10);
               if (!verticalOverlap) return false;
               const minLineX = Math.min(sourceXVal, targetXVal);
               const maxLineX = Math.max(sourceXVal, targetXVal);
               const boxLeft = box.x;
               const boxRight = box.x + box.w;
               const horizontalOverlap = !(maxLineX < boxLeft || minLineX > boxRight);
               return horizontalOverlap;
             });

             let edgePath = '';
             const sourceParentBound = semesterBounds.find((b) => b.id === nodeCoords[prereq]?.parentNode);
             const targetParentBound = semesterBounds.find((b) => b.id === nodeCoords[course.code]?.parentNode);
              
             if (obstacles.length > 0) {
               let minObsX = Infinity;
               let maxObsX = -Infinity;
               let maxObsY = -Infinity;
               obstacles.forEach((box: SemesterBoundItem) => {
                 minObsX = Math.min(minObsX, box.x);
                 maxObsX = Math.max(maxObsX, box.x + box.w);
                 maxObsY = Math.max(maxObsY, box.y + box.h);
               });
               const distToLeft = Math.abs(sourceXVal - minObsX);
               const distToRight = Math.abs(sourceXVal - maxObsX);
               const detourX = distToLeft < distToRight ? minObsX - 40 : maxObsX + 40;
                
               const sourceContainerBottom = sourceParentBound ? (sourceParentBound.y + sourceParentBound.h) : sourceYVal;
               const yStep1 = sourceParentBound && targetParentBound && sourceParentBound.id !== targetParentBound.id
                 ? sourceContainerBottom + 20
                 : sourceYVal + 30;
               const yStep2 = maxObsY + 30;
               edgePath = `M ${sourceXVal} ${sourceYVal} L ${sourceXVal} ${yStep1} L ${detourX} ${yStep1} L ${detourX} ${yStep2} L ${targetXVal} ${yStep2} L ${targetXVal} ${targetYVal}`;
             } else {
               if (sourceParentBound && targetParentBound && sourceParentBound.id !== targetParentBound.id) {
                 const sourceContainerBottom = sourceParentBound.y + sourceParentBound.h;
                 const yStep = sourceContainerBottom + 20;
                 edgePath = `M ${sourceXVal} ${sourceYVal} L ${sourceXVal} ${yStep} L ${targetXVal} ${yStep} L ${targetXVal} ${targetYVal}`;
               } else {
                 const [path] = getSmoothStepPath({
                   sourceX: sourceXVal,
                   sourceY: sourceYVal,
                   sourcePosition: Position.Bottom,
                   targetX: targetXVal,
                   targetY: targetYVal,
                   targetPosition: Position.Top,
                 });
                 edgePath = path;
               }
             }

             flowEdges.push({
               id: `${prereq}-${course.code}`,
               source: prereq,
               target: course.code,
               sourceHandle: `source-${successorIndex}`,
               targetHandle: `target-${prereqIndex}`,
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
                 showPrereqLabel,
                 showSuccessorLabel,
                 sourceCourseName: courses[prereq]?.name || prereq,
                 targetCourseName: course.name,
                 prereqIndex,
                 successorIndex,
                 sourceParentId: nodeCoords[prereq]?.parentNode,
                 targetParentId: nodeCoords[course.code]?.parentNode,
                 semesterBounds,
                 pathData: {
                   d: edgePath,
                   sourceX: sourceXVal,
                   sourceY: sourceYVal,
                   targetX: targetXVal,
                   targetY: targetYVal,
                 },
               },
             });
          }
        });
      }
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [courses, highlightedNodes, selectedCourseId, selectedSemester, activeProgram, isDataEmpty]);

  // Fit view when active program changes
  useEffect(() => {
    if (isDataEmpty) return;
    setTimeout(() => {
      fitView({ duration: 800, padding: 0.2 });
    }, 100);
  }, [activeProgram, fitView, isDataEmpty]);

  // Zoom into selected node when selectedCourseId changes
  useEffect(() => {
    if (isDataEmpty) return;
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
  }, [selectedCourseId, nodes, setCenter, isDataEmpty]);

  // Zoom/fit bounds of the selected semester group node when selectedSemester changes
  useEffect(() => {
    if (isDataEmpty) return;
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
  }, [selectedSemester, nodes, fitBounds, fitView, isDataEmpty]);

  // Empty State Alert Box for unpublished datasets (e.g. IS KKI)
  if (isDataEmpty) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-[#111111] px-6 text-center select-none">
        <div className="max-w-2xl bg-[#1E1E1E] border border-[#EF4444]/30 p-8 rounded-lg shadow-2xl animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-full flex items-center justify-center text-[#EF4444] mx-auto mb-6 text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC] mb-4">Informasi Belum Tersedia</h2>
          <p className="text-sm text-[#E2E8F0] leading-relaxed text-justify">
            This page is currently unavailable due to the fact that the guidebook for IS KKI is not yet published. You may refer to the IS section (the regular program) for reference. Note that the regular IS program and the KKI IS program may have different courses take place in different semesters. If the guidebook has been published but this page has not been updated, please contact the developer of the website. Contact information is available in the &quot;Kontak&quot; box in the top navigation bar. Thank you for understanding.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#111111] relative">
      {/* Floating AI Disclaimer Banner */}
      {activeProgram === 'AI' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300 pointer-events-none">
          <div className="bg-[#1E1E1E] border border-[#C5A059]/40 text-[#C5A059] px-4 py-2.5 rounded-md shadow-lg text-xs font-bold font-sans flex items-center gap-2">
            <span>Catatan: Informasi prasyarat mata kuliah belum tersedia. Ini akan diupdate saat informasi tersebut diumumkan.</span>
          </div>
        </div>
      )}

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
