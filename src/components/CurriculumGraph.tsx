'use client';

import React, { useEffect, useMemo, useDeferredValue } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  useReactFlow,
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

// ─── Routing engine helpers (moved from PrerequisiteEdge for shared single computation) ───

interface ObstacleBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const snapToGrid = (x: number) => Math.round(x / 20) * 20;

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

  // P3: Defer the expensive Dagre layout computation off the blocking render path.
  // deferredCourses lags behind `courses` by one render when the program switches,
  // allowing the shell UI (nav, sidebar) to repaint immediately.
  const deferredCourses = useDeferredValue(courses);
  const isLayoutStale = deferredCourses !== courses;

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
  // 2. Generate laid-out React Flow Nodes and Edges using Dagre
  // Hook 1: Runs Dagre layout only when raw dataset changes
  const baseLayout = useMemo(() => {
    if (isDataEmpty) {
      return { nodes: [], edges: [] };
    }

    const dagreGraph = new dagre.graphlib.Graph({ compound: true });
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Configure Dagre layout: Top-to-Bottom, compound layouts, spacious separation
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 160, compound: true });

    const isAI = activeProgram === 'AI';

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

    // Pre-compute successor counts (O(n)) so CourseNode can avoid O(n²) scans
    const successorMap: Record<string, number> = {};
    courseList.forEach((course) => {
      course.prerequisites?.forEach((prereq) => {
        successorMap[prereq] = (successorMap[prereq] || 0) + 1;
      });
    });

    // Add child nodes to Dagre & establish parent relationships
    courseList.forEach((course) => {
      const outgoingCount = successorMap[course.code] || 0;
      const maxConn = Math.max(course.prerequisites ? course.prerequisites.length : 0, outgoingCount);
      const nodeWidth = Math.max(320, maxConn * 40);
      dagreGraph.setNode(course.code, { width: nodeWidth, height: 120 });
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

    const getCourseWidth = (course: Course) => {
      const outgoingCount = successorMap[course.code] || 0;
      const maxConn = Math.max(course.prerequisites ? course.prerequisites.length : 0, outgoingCount);
      return Math.max(320, maxConn * 40);
    };

    const padding = 40;
    const headerHeight = 120;
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

    // Pre-calculate heights and widths of all active semesters to position them in a custom layout
    const semHeights: Record<string, number> = {};
    const semWidths: Record<string, number> = {};
    const semY: Record<string, number> = {};

    semestersList.forEach((sem) => {
      const semCourses = coursesBySem[sem] || [];
      if (semCourses.length === 0) return;

      let parentWidth = 0;
      let parentHeight = 0;
      if (isAI || sem === 'pilihan') {
        const rows = Math.ceil(semCourses.length / cols);
        let colWidth = 320;
        semCourses.forEach((c) => {
          colWidth = Math.max(colWidth, getCourseWidth(c));
        });
        parentWidth = cols * colWidth + (cols - 1) * gap + 2 * padding;
        parentHeight = rows * 120 + (rows - 1) * gap + 2 * padding + headerHeight;
      } else {
        let sumW = 0;
        semCourses.forEach((c) => {
          sumW += getCourseWidth(c);
        });
        parentWidth = sumW + (semCourses.length - 1) * gap + 2 * padding;
        parentHeight = 120 + 2 * padding + headerHeight;
      }
      semWidths[sem] = parentWidth;
      semHeights[sem] = parentHeight;
    });

    const centerRefX = 1200;
    const rowGap = 240;
    const shiftX = 360;

    // Calculate Y offsets for semesters 1-5
    let currentY = 0;
    ['1', '2', '3', '4', '5'].forEach((sem) => {
      if (semHeights[sem] !== undefined) {
        semY[sem] = currentY;
        currentY += semHeights[sem] + rowGap;
      }
    });

    // Pilihan and Semesters 6-8 top boundary starts below Semester 5
    const blocksTopY = currentY;

    // Pilihan (Green block) on the left side
    const pilihanWidth = semWidths['pilihan'] || 0;
    const pilihanX = centerRefX - 80 - pilihanWidth;

    // Blue block (Semesters 6-8) on the right side
    const blueBlockX = centerRefX + 80;

    // 1. Generate Semester Group Nodes (Backdrop Cards) with custom layout coordinates
    semestersList.forEach((sem) => {
      const semCourses = coursesBySem[sem];
      if (semCourses.length === 0) return;

      const parentWidth = semWidths[sem];
      const parentHeight = semHeights[sem];

      // Center container card exactly where Dagre positioned the semester compound node center by default
      const parentDagreNode = dagreGraph.node(`semester-${sem}`);
      const centerX = parentDagreNode?.x || 0;
      const centerY = parentDagreNode?.y || 0;

      let parentX = centerX - parentWidth / 2;
      let parentY = centerY - parentHeight / 2;

      // Custom Zig-Zag and Side-by-Side block coordinates override
      if (isCS || isIS) {
        if (sem === '1') {
          parentX = centerRefX - parentWidth / 2;
          parentY = semY['1'] ?? parentY;
        } else if (sem === '2') {
          parentX = centerRefX - parentWidth / 2 + shiftX;
          parentY = semY['2'] ?? parentY;
        } else if (sem === '3') {
          parentX = centerRefX - parentWidth / 2 - shiftX;
          parentY = semY['3'] ?? parentY;
        } else if (sem === '4') {
          parentX = centerRefX - parentWidth / 2 + shiftX;
          parentY = semY['4'] ?? parentY;
        } else if (sem === '5') {
          parentX = centerRefX - parentWidth / 2 - shiftX;
          parentY = semY['5'] ?? parentY;
        } else if (sem === 'pilihan') {
          parentX = pilihanX;
          parentY = blocksTopY;
        } else if (sem === '6') {
          parentX = blueBlockX + 150;
          parentY = blocksTopY;
        } else if (sem === '7') {
          parentX = blueBlockX;
          parentY = blocksTopY + (semHeights['6'] || 0) + rowGap;
        } else if (sem === '8') {
          parentX = blueBlockX + 300;
          parentY = blocksTopY + (semHeights['6'] || 0) + (semHeights['7'] || 0) + 2 * rowGap;
        }
      } else if (isAI) {
        const catIndex = semestersList.indexOf(sem);
        const col = catIndex % 3;
        const row = Math.floor(catIndex / 3);
        const colWidth = 1140;
        const colGap = 80;
        const aiRowGap = 120;
        const row0MaxHeight = 450;

        parentX = col * (colWidth + colGap);
        parentY = row === 0 ? 0 : row0MaxHeight + aiRowGap;
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
    semestersList.forEach((sem) => {
      const semCourses = coursesBySem[sem];
      let currentXOffset = padding;
      let colWidth = 320;
      if (isAI || sem === 'pilihan') {
        semCourses.forEach((c) => {
          colWidth = Math.max(colWidth, getCourseWidth(c));
        });
      }

      semCourses.forEach((course, index) => {
        const semNumber = (sem === 'pilihan' || isAI) ? undefined : parseInt(sem, 10);
        const enrichedCourse = {
          ...course,
          recommendedSemester: semNumber,
          outgoingCount: successorMap[course.code] || 0,
        };

        let relativeX = 0;
        let relativeY = 0;

        // Positioning logic matching the group shapes
        if (isAI || sem === 'pilihan') {
          const col = index % cols;
          const row = Math.floor(index / cols);
          relativeX = padding + col * (colWidth + gap);
          relativeY = padding + headerHeight + row * (120 + gap);
        } else {
          relativeX = currentXOffset;
          relativeY = padding + headerHeight;
          currentXOffset += getCourseWidth(course) + gap;
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
    
    // First pass: count source/target occurrences to separate parallel lines
    const sourceCounts: Record<string, number> = {};
    const targetCounts: Record<string, number> = {};

    courseList.forEach((course) => {
      if (course.prerequisites) {
        course.prerequisites.forEach((prereq) => {
          if (courses[prereq]) {
            sourceCounts[prereq] = (sourceCounts[prereq] || 0) + 1;
            targetCounts[course.code] = (targetCounts[course.code] || 0) + 1;
          }
        });
      }
    });

    // Group edges by their semester transition pair to assign unique lanes
    interface EdgeGroupItem {
      prereq: string;
      courseCode: string;
      sourceX: number;
      targetX: number;
    }
    const edgeGroups: Record<string, EdgeGroupItem[]> = {};

    courseList.forEach((course) => {
      if (course.prerequisites) {
        course.prerequisites.forEach((prereq) => {
          if (courses[prereq]) {
            const sourceSem = getRecommendedSemester(courses[prereq], activeProgram);
            const targetSem = getRecommendedSemester(course, activeProgram);
            const key = `${sourceSem}-${targetSem}`;
            
            const sourceDagreNode = dagreGraph.node(prereq);
            const targetDagreNode = dagreGraph.node(course.code);
            const sourceX = sourceDagreNode?.x || 0;
            const targetX = targetDagreNode?.x || 0;

            if (!edgeGroups[key]) {
              edgeGroups[key] = [];
            }
            edgeGroups[key].push({ prereq, courseCode: course.code, sourceX, targetX });
          }
        });
      }
    });

    const edgeLanes: Record<string, { laneIndex: number; laneTotal: number }> = {};
    Object.keys(edgeGroups).forEach((key) => {
      const items = edgeGroups[key];
      // Sort edges horizontally by the average of their source/target X coordinates to prevent crossings
      items.sort((a, b) => (a.sourceX + a.targetX) - (b.sourceX + b.targetX));
      items.forEach((item, index) => {
        edgeLanes[`${item.prereq}-${item.courseCode}`] = {
          laneIndex: index,
          laneTotal: items.length,
        };
      });
    });

    const sourceCurrentIndex: Record<string, number> = {};
    const targetCurrentIndex: Record<string, number> = {};

    courseList.forEach((course) => {
      if (course.prerequisites) {
        course.prerequisites.forEach((prereq) => {
          if (courses[prereq]) {
             const sCount = sourceCounts[prereq] || 1;
             const tCount = targetCounts[course.code] || 1;
             const sIdx = sourceCurrentIndex[prereq] || 0;
             sourceCurrentIndex[prereq] = sIdx + 1;
             const tIdx = targetCurrentIndex[course.code] || 0;
             targetCurrentIndex[course.code] = tIdx + 1;

             const laneInfo = edgeLanes[`${prereq}-${course.code}`] || { laneIndex: 0, laneTotal: 1 };

             flowEdges.push({
               id: `${prereq}-${course.code}`,
               source: prereq,
               target: course.code,
               sourceHandle: `source-${sIdx}`,
               targetHandle: `target-${tIdx}`,
               type: 'prerequisite',
               data: {
                 sourceCourseName: courses[prereq]?.name || prereq,
                 targetCourseName: course.name,
                 prereqIndex: course.prerequisites.indexOf(prereq),
                 sourceParentId: `semester-${getRecommendedSemester(courses[prereq], activeProgram)}`,
                 targetParentId: `semester-${getRecommendedSemester(course, activeProgram)}`,
                 semesterBounds,
                 sourceIndex: sIdx,
                 sourceTotal: sCount,
                 targetIndex: tIdx,
                 targetTotal: tCount,
                 laneIndex: laneInfo.laneIndex,
                 laneTotal: laneInfo.laneTotal,
               },
             });
          }
        });
      }
    });

    return { nodes: flowNodes, edges: flowEdges };
  // `courses` (the live prop) is intentionally omitted — we use deferredCourses
  // to defer the heavy Dagre computation off the blocking render path (P3).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredCourses, activeProgram, isDataEmpty]);

  // Hook 2: Applies styling/highlight state to nodes and edges. Bypasses Dagre completely.
  const { nodes, edges } = useMemo(() => {
    if (!baseLayout) return { nodes: [], edges: [] };

    const { nodes: baseNodes, edges: baseEdges } = baseLayout;

    const courseList = Object.values(deferredCourses);

    const mappedEdges = baseEdges.map((edge) => {
      const prereq = edge.source;
      const courseCode = edge.target;
      const course = deferredCourses[courseCode];
      if (!course) return edge;

      const hasHighlight = highlightedNodes.size > 0;
      const isSourceActive = !hasHighlight || highlightedNodes.has(prereq);
      const isTargetActive = !hasHighlight || highlightedNodes.has(courseCode);
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

      const showPrereqLabel = isHighlightedEdge && selectedCourseId === courseCode;
      const showSuccessorLabel = isHighlightedEdge && selectedCourseId === prereq;

      let successorIndex = 0;
      if (showSuccessorLabel) {
        const successors = courseList
          .filter((c) => c.prerequisites && c.prerequisites.includes(prereq))
          .map((c) => c.code)
          .sort();
        successorIndex = successors.indexOf(courseCode);
      }

      return {
        ...edge,
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
          ...edge.data,
          showPrereqLabel,
          showSuccessorLabel,
          successorIndex,
          // pathData injected below after routingPathMap is computed
        },
      };
    });

    return { nodes: baseNodes, edges: mappedEdges };
  }, [baseLayout, highlightedNodes, selectedCourseId, selectedSemester, deferredCourses]);

  // ─── Routing Engine: derived from baseLayout.nodes (stable, no RF store subscription) ───
  // IMPORTANT: We intentionally do NOT use useStore(nodeInternals) here.
  // Array.from(nodeInternals.values()) creates a new reference on every RF store update,
  // which would cause routingPathMap → edgesWithPaths → setEdges → RF store update → infinite loop.
  // baseLayout.nodes contains the same positions (we set them explicitly) and is stable.
  // Stable reference — baseLayout.nodes is already memoised, but the `?? []` fallback
  // would create a new array reference on every render. useMemo ensures the routing
  // engine only recomputes when baseLayout actually changes.
  const layoutNodes = React.useMemo(() => baseLayout?.nodes ?? [], [baseLayout]);


  const rfNodeMap = React.useMemo(() => {
    const map: Record<string, Node> = {};
    layoutNodes.forEach((n) => { map[n.id] = n; });
    return map;
  }, [layoutNodes]);

  const rfSemesterBounds = React.useMemo(() => {
    return layoutNodes
      .filter((n) => n.type === 'semesterGroup')
      .map((n) => ({
        id: n.id,
        x: n.position.x,
        y: n.position.y,
        w: Number(n.width || n.style?.width || 320),
        h: Number(n.height || n.style?.height || 480),
      }));
  }, [layoutNodes]);

  const rfEdgeSourceCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    if (!baseLayout) return counts;
    baseLayout.edges.forEach((edge) => {
      counts[edge.source] = (counts[edge.source] || 0) + 1;
    });
    return counts;
  }, [baseLayout]);

  const rfEdgeTargetCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    if (!baseLayout) return counts;
    baseLayout.edges.forEach((edge) => {
      counts[edge.target] = (counts[edge.target] || 0) + 1;
    });
    return counts;
  }, [baseLayout]);

  const rfNodeBounds = React.useMemo(() => {
    const bounds: Record<string, ObstacleBox> = {};
    if (!baseLayout) return bounds;
    layoutNodes.forEach((node) => {
      if (node.type !== 'course') return;
      const parentNode = node.parentNode ? rfNodeMap[node.parentNode] : null;
      const parentX = parentNode?.position.x || 0;
      const parentY = parentNode?.position.y || 0;
      const outgoingCount = baseLayout.edges.filter((e) => e.source === node.id).length;
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
  }, [layoutNodes, baseLayout, rfNodeMap]);

  const routingPathMap = React.useMemo(() => {
    if (!baseLayout || baseLayout.edges.length === 0 || layoutNodes.length === 0) return null;

    const baseEdges = baseLayout.edges;

    const adjustDetourX = (x: number, side: string, sourceParentId: string | undefined | null, targetParentId: string | undefined | null, sourceY: number, targetY: number) => {
      let adjustedX = x;
      rfSemesterBounds.forEach((box) => {
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

    type EdgeInfo = {
      id: string; sourceX: number; sourceY: number; targetX: number; targetY: number;
      sourceSem: number; targetSem: number; obstacles: ObstacleBox[];
      minObsX: number; maxObsX: number; maxObsY: number;
      detourSide: string; lastObstacleSem: number;
      sourceParentId: string | undefined; targetParentId: string | undefined;
      sourceOffset: number; targetOffset: number; verticalLaneIndex: number;
    };

    const edgeInfos: EdgeInfo[] = baseEdges
      .map((edge) => {
        const sourceNode = rfNodeMap[edge.source];
        const targetNode = rfNodeMap[edge.target];
        if (!sourceNode || !targetNode) return null;

        const sIdx = parseInt(edge.sourceHandle?.replace('source-', '') || '0', 10);
        const tIdx = parseInt(edge.targetHandle?.replace('target-', '') || '0', 10);
        const sCount = rfEdgeSourceCounts[edge.source] || 1;
        const tCount = rfEdgeTargetCounts[edge.target] || 1;
        const sourceOffset = (sIdx - (sCount - 1) / 2) * 40;
        const targetOffset = (tIdx - (tCount - 1) / 2) * 40;

        const sBounds = rfNodeBounds[edge.source];
        const tBounds = rfNodeBounds[edge.target];
        if (!sBounds || !tBounds) return null;

        const sourceXCoord = sBounds.x + sBounds.w / 2 + sourceOffset;
        const sourceYCoord = sBounds.y + sBounds.h;
        const targetXCoord = tBounds.x + tBounds.w / 2 + targetOffset;
        const targetYCoord = tBounds.y;

        const sourceSem = getSemNumFromY(sourceYCoord);
        const targetSem = getSemNumFromY(targetYCoord);

        const obstacles: ObstacleBox[] = [];

        rfSemesterBounds.forEach((box) => {
          if (box.id === sourceNode.parentNode || box.id === targetNode.parentNode) return;
          const verticalOverlap = box.y > sourceYCoord + 5 && box.y < targetYCoord - 5;
          if (!verticalOverlap) return;
          const minLineX = Math.min(sourceXCoord, targetXCoord);
          const maxLineX = Math.max(sourceXCoord, targetXCoord);
          const horizontalOverlap = !(maxLineX < box.x || minLineX > box.x + box.w);
          if (horizontalOverlap) obstacles.push(box);
        });

        Object.values(rfNodeBounds).forEach((box) => {
          const courseNode = rfNodeMap[box.id];
          if (!courseNode || courseNode.parentNode !== targetNode.parentNode) return;
          if (box.id === edge.source || box.id === edge.target) return;
          const verticalOverlap = box.y > sourceYCoord + 5 && box.y < targetYCoord - 5;
          if (!verticalOverlap) return;
          const minLineX = Math.min(sourceXCoord, targetXCoord);
          const maxLineX = Math.max(sourceXCoord, targetXCoord);
          const horizontalOverlap = !(maxLineX < box.x || minLineX > box.x + box.w);
          if (horizontalOverlap) obstacles.push(box);
        });

        rfSemesterBounds.forEach((box) => {
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
            obstacles.push({ id: box.id, x: labelLeft, y: labelTop, w: 320, h: 80 });
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
            const courseNode = rfNodeMap[box.id];
            const semNum = courseNode?.parentNode ? getSemNum(courseNode.parentNode) : getSemNum(box.id);
            if (semNum > lastObstacleSem) lastObstacleSem = semNum;
          });
          lastObstacleSem = Math.min(lastObstacleSem, targetSem - 1);
          const distToLeft = Math.abs(sourceXCoord - minObsX);
          const distToRight = Math.abs(sourceXCoord - maxObsX);
          detourSide = distToLeft < distToRight ? 'left' : 'right';
        }

        return {
          id: edge.id, sourceX: sourceXCoord, sourceY: sourceYCoord,
          targetX: targetXCoord, targetY: targetYCoord,
          sourceSem, targetSem, obstacles, minObsX, maxObsX, maxObsY,
          detourSide, lastObstacleSem,
          sourceParentId: sourceNode.parentNode, targetParentId: targetNode.parentNode,
          sourceOffset, targetOffset, verticalLaneIndex: 0,
        };
      })
      .filter((info): info is EdgeInfo => info !== null);

    function colorVerticalDetours(detours: EdgeInfo[]) {
      const n = detours.length;
      if (n === 0) return;
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const overlap = Math.max(detours[i].sourceY, detours[j].sourceY) < Math.min(detours[i].targetY, detours[j].targetY);
          if (overlap) { adj[i].push(j); adj[j].push(i); }
        }
      }
      const colors = new Array(n).fill(-1);
      const indices = Array.from({ length: n }, (_, i) => i);
      indices.sort((i, j) => detours[i].sourceY - detours[j].sourceY);
      indices.forEach((idx) => {
        const d = detours[idx];
        const neighborColors = new Set<number>();
        adj[idx].forEach((neigh) => { if (colors[neigh] !== -1) neighborColors.add(colors[neigh]); });
        const usedXCoords = new Set<number>();
        edgeInfos.forEach((other) => {
          const overlap = Math.max(d.sourceY, other.sourceY) < Math.min(d.targetY, other.targetY);
          if (overlap) { usedXCoords.add(Math.round(other.sourceX)); usedXCoords.add(Math.round(other.targetX)); }
        });
        detours.forEach((other, oIdx) => {
          if (colors[oIdx] !== -1 && other.id !== d.id) {
            const overlap = Math.max(d.sourceY, other.sourceY) < Math.min(d.targetY, other.targetY);
            if (overlap) {
              const rawOtherDetourX = other.detourSide === 'left'
                ? other.minObsX - 40 - colors[oIdx] * 20
                : other.maxObsX + 40 + colors[oIdx] * 20;
              usedXCoords.add(Math.round(adjustDetourX(rawOtherDetourX, other.detourSide, other.sourceParentId, other.targetParentId, other.sourceY, other.targetY)));
            }
          }
        });
        let c = 0;
        while (true) {
          if (!neighborColors.has(c)) {
            const rawDetourX = d.detourSide === 'left' ? d.minObsX - 40 - c * 20 : d.maxObsX + 40 + c * 20;
            if (!usedXCoords.has(Math.round(adjustDetourX(rawDetourX, d.detourSide, d.sourceParentId, d.targetParentId, d.sourceY, d.targetY)))) break;
          }
          c++;
        }
        colors[idx] = c;
      });
      detours.forEach((info, i) => { info.verticalLaneIndex = colors[i]; });
    }

    const leftDetours = edgeInfos.filter((info) => info.obstacles.length > 0 && info.detourSide === 'left');
    const rightDetours = edgeInfos.filter((info) => info.obstacles.length > 0 && info.detourSide === 'right');
    colorVerticalDetours(leftDetours);
    colorVerticalDetours(rightDetours);

    const gapSegments: { edgeIdx: number; segmentType: 'step1' | 'step2' | 'turn'; x1: number; x2: number; detourX?: number; }[][] = Array.from({ length: 12 }, () => []);
    edgeInfos.forEach((info, idx) => {
      if (info.obstacles.length > 0) {
        const rawDetourX = info.detourSide === 'left'
          ? info.minObsX - 40 - info.verticalLaneIndex * 20
          : info.maxObsX + 40 + info.verticalLaneIndex * 20;
        const detourX = adjustDetourX(rawDetourX, info.detourSide, info.sourceParentId, info.targetParentId, info.sourceY, info.targetY);
        gapSegments[info.sourceSem].push({ edgeIdx: idx, segmentType: 'step1', x1: Math.min(info.sourceX, detourX), x2: Math.max(info.sourceX, detourX), detourX });
        gapSegments[info.lastObstacleSem || info.sourceSem].push({ edgeIdx: idx, segmentType: 'step2', x1: Math.min(detourX, info.targetX), x2: Math.max(detourX, info.targetX), detourX });
      } else {
        gapSegments[info.sourceSem].push({ edgeIdx: idx, segmentType: 'turn', x1: Math.min(info.sourceX, info.targetX), x2: Math.max(info.sourceX, info.targetX) });
      }
    });

    const segmentYMap: Record<string, number> = {};
    for (let g = 1; g <= 9; g++) {
      const segments = gapSegments[g];
      const m = segments.length;
      if (m === 0) continue;
      const semG = rfSemesterBounds.find((b) => b.id === `semester-${g}`);
      const semG1 = rfSemesterBounds.find((b) => b.id === `semester-${g + 1}`);
      const minY = semG ? semG.y + semG.h + 40 : 0;
      const maxY = semG1 ? semG1.y - 40 : minY + 200;
      const availableHeight = maxY - minY;
      const conflicts = Array.from({ length: m }, () => new Set<number>());
      for (let i = 0; i < m; i++) {
        for (let j = i + 1; j < m; j++) {
          const overlap = Math.max(segments[i].x1, segments[j].x1) < Math.min(segments[i].x2, segments[j].x2);
          if (overlap) { conflicts[i].add(j); conflicts[j].add(i); }
        }
      }
      let colors2 = new Array(m).fill(-1);
      let changed = true, iterations = 0;
      while (changed && iterations < 10) {
        changed = false;
        iterations++;
        colors2 = new Array(m).fill(-1);
        const idxs = Array.from({ length: m }, (_, i) => i);
        idxs.sort((i, j) => segments[i].x1 - segments[j].x1);
        idxs.forEach((idx) => {
          const neighborColors = new Set<number>();
          conflicts[idx].forEach((neigh) => { if (colors2[neigh] !== -1) neighborColors.add(colors2[neigh]); });
          let c = 0;
          while (neighborColors.has(c)) c++;
          colors2[idx] = c;
        });
        const laneTotal2 = Math.max(...colors2) + 1;
        const spacing2 = Math.min(20, availableHeight / (laneTotal2 + 1));
        const currentIntervals = segments.map((seg, i) => {
          const laneIndex = colors2[i];
          const rawY = minY + (laneIndex + 1) * spacing2;
          const y = spacing2 >= 20 ? snapToGrid(rawY) : Math.round(rawY);
          let x1 = seg.x1, x2 = seg.x2;
          if (seg.segmentType === 'step1' || seg.segmentType === 'step2') {
            const info = edgeInfos[seg.edgeIdx];
            const detourX = snapToGrid(info.detourSide === 'left'
              ? info.minObsX - 40 - info.verticalLaneIndex * 20
              : info.maxObsX + 40 + info.verticalLaneIndex * 20);
            if (seg.segmentType === 'step1') { x1 = Math.min(info.sourceX, detourX); x2 = Math.max(info.sourceX, detourX); }
            else { x1 = Math.min(detourX, info.targetX); x2 = Math.max(detourX, info.targetX); }
          }
          return { x1, x2, y };
        });
        for (let i = 0; i < m; i++) {
          for (let j = i + 1; j < m; j++) {
            if (currentIntervals[i].y === currentIntervals[j].y) {
              const s1 = currentIntervals[i], s2 = currentIntervals[j];
              const overlap = Math.max(s1.x1, s2.x1) < Math.min(s1.x2, s2.x2);
              if (overlap && !conflicts[i].has(j)) { conflicts[i].add(j); conflicts[j].add(i); changed = true; }
            }
          }
        }
      }
      const laneTotal = Math.max(...colors2) + 1;
      const spacing = Math.min(20, availableHeight / (laneTotal + 1));
      segments.forEach((seg, i) => {
        const laneIndex = colors2[i];
        const rawY = minY + (laneIndex + 1) * spacing;
        const y = spacing >= 20 ? snapToGrid(rawY) : Math.round(rawY);
        segmentYMap[`${seg.edgeIdx}_${seg.segmentType}`] = y;
      });
    }

    const pathMap: Record<string, { d: string; sourceX: number; sourceY: number; targetX: number; targetY: number }> = {};
    edgeInfos.forEach((info, idx) => {
      let d = '';
      if (info.obstacles.length > 0) {
        const rawDetourX = info.detourSide === 'left'
          ? info.minObsX - 40 - info.verticalLaneIndex * 20
          : info.maxObsX + 40 + info.verticalLaneIndex * 20;
        const detourX = adjustDetourX(rawDetourX, info.detourSide, info.sourceParentId, info.targetParentId, info.sourceY, info.targetY);
        const yStep1 = segmentYMap[`${idx}_step1`] || (info.sourceY + 40);
        const yStep2 = segmentYMap[`${idx}_step2`] || (info.targetY - 40);
        d = `M ${info.sourceX} ${info.sourceY - 3} L ${info.sourceX} ${yStep1} L ${detourX} ${yStep1} L ${detourX} ${yStep2} L ${info.targetX} ${yStep2} L ${info.targetX} ${info.targetY + 3}`;
      } else {
        const yTurn = segmentYMap[`${idx}_turn`] || ((info.sourceY + info.targetY) / 2);
        d = `M ${info.sourceX} ${info.sourceY - 3} L ${info.sourceX} ${yTurn} L ${info.targetX} ${yTurn} L ${info.targetX} ${info.targetY + 3}`;
      }
      pathMap[info.id] = { d, sourceX: info.sourceX, sourceY: info.sourceY, targetX: info.targetX, targetY: info.targetY };
    });

    return pathMap;
  }, [layoutNodes, rfNodeMap, rfSemesterBounds, rfEdgeSourceCounts, rfEdgeTargetCounts, rfNodeBounds, baseLayout]);

  // Hook 3: Merges pre-computed pathData from routingPathMap into the styled edges.
  // Split from Hook 2 to resolve declaration order (routingPathMap must be declared first).
  const edgesWithPaths = React.useMemo(() => {
    if (!routingPathMap) return edges;
    return edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        pathData: routingPathMap[edge.id] ?? null,
      },
    }));
  }, [edges, routingPathMap]);

  const handlePaneClick = React.useCallback(() => {
    setSelectedCourseId(null);
  }, [setSelectedCourseId]);

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
          const courseData = selectedNode.data as Course;
          const incoming = courseData.prerequisites ? courseData.prerequisites.length : 0;
          const outgoingCount = nodes.filter((n) => n.type === 'course' && (n.data as Course).prerequisites?.includes(selectedNode.id)).length;
          const maxConn = Math.max(incoming, outgoingCount);
          const courseWidth = Math.max(320, maxConn * 40);
          const absoluteX = selectedNode.position.x + parentNode.position.x + courseWidth / 2;
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

      {/* P3: Loading overlay shown while deferred Dagre layout catches up */}
      {isLayoutStale && (
        <div className="absolute inset-0 z-40 bg-[#111111]/60 flex items-center justify-center pointer-events-none">
          <div className="bg-[#1E1E1E] border border-[#333333] rounded-lg px-6 py-3 flex items-center gap-3 shadow-xl">
            <div className="w-4 h-4 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-sans text-[#E2E8F0]">Memuat peta kurikulum...</span>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edgesWithPaths}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onPaneClick={handlePaneClick}
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
