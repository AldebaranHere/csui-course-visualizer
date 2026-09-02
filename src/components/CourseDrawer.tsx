import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useCurriculumStore } from '@/store/useCurriculumStore';
import { Course } from '@/types/curriculum';

interface CourseDrawerProps {
  courses: Record<string, Course>;
}

interface CourseCodeBreakdown {
  label: string;
  value: string;
  explanation: string;
}

function parseCourseCode(code: string): {
  isValid: boolean;
  breakdown: CourseCodeBreakdown[];
  note: string;
} {
  const note = "Catatan: Ketersediaan mata kuliah tidak dijamin sepenuhnya oleh pola kode ini, melainkan sekadar penjelasan makna kode dalam bahasa alami.";
  
  if (!code || code.length !== 10) {
    return { isValid: false, breakdown: [], note };
  }

  const breakdown: CourseCodeBreakdown[] = [];

  // 1. Karakter 1-4 (Kode Universitas/Fakultas/Prodi/Jenis)
  const prefix = code.slice(0, 4);
  if (prefix === 'UIGE') {
    breakdown.push({
      label: 'Karakter 1–4',
      value: 'UIGE',
      explanation: 'Mata kuliah wajib universitas.',
    });
  } else {
    const faculty = prefix.slice(0, 2);
    const prodi = prefix.charAt(2);
    const type = prefix.charAt(3);
    
    const facText = faculty === 'CS' ? 'Fakultas Ilmu Komputer' : `Fakultas ${faculty}`;
    const prodiText = prodi === 'C' ? 'Program Studi Ilmu Komputer' : prodi === 'I' ? 'Program Studi Sistem Informasi' : `Program Studi ${prodi}`;
    const typeText = type === 'M' ? 'Mata kuliah wajib (Mandatory)' : type === 'E' ? 'Mata kuliah pilihan (Elective)' : `Mata kuliah ${type}`;
    
    breakdown.push({
      label: 'Karakter 1–4',
      value: prefix,
      explanation: `${facText}, ${prodiText}, ${typeText}.`,
    });
  }

  // 2. Karakter 5 (Jenjang)
  const levelChar = code.charAt(4);
  const levelText = levelChar === '6' ? 'Jenjang Sarjana (S1 / KKNI Level 6)' : `Jenjang pendidikan level ${levelChar}`;
  breakdown.push({
    label: 'Karakter 5',
    value: levelChar,
    explanation: levelText,
  });

  // 3. Karakter 6 (Jenis Kelas/Bahasa)
  const classChar = code.charAt(5);
  let classText = '';
  if (classChar === '0') {
    classText = 'Kelas reguler (Bahasa Indonesia sebagai pengantar)';
  } else if (classChar === '1') {
    classText = 'Kelas internasional / KKI (Bahasa Inggris sebagai pengantar)';
  } else {
    classText = `Jenis kelas/bahasa pengantar kode ${classChar}`;
  }
  breakdown.push({
    label: 'Karakter 6',
    value: classChar,
    explanation: classText,
  });

  // 4. Karakter 7 (Tahun Kuliah)
  const yearChar = code.charAt(6);
  breakdown.push({
    label: 'Karakter 7',
    value: yearChar,
    explanation: `Umumnya ditawarkan untuk mahasiswa tahun ke‑${yearChar}.`,
  });

  // 5. Karakter 8 (Semester)
  const semChar = code.charAt(7);
  let semText = '';
  if (semChar === '0') {
    semText = 'Dapat dibuka pada semester ganjil maupun genap';
  } else if (semChar === '1') {
    semText = 'Umumnya ditawarkan di semester ganjil (odd)';
  } else if (semChar === '2') {
    semText = 'Umumnya ditawarkan di semester genap (even)';
  } else {
    semText = `Semester dibuka kode ${semChar}`;
  }
  breakdown.push({
    label: 'Karakter 8',
    value: semChar,
    explanation: semText,
  });

  // 6. Karakter 9 (Kelompok Disiplin)
  const groupChar = code.charAt(8);
  let groupText = '';
  switch (groupChar) {
    case '1': groupText = 'Matematika & komputasi ilmiah'; break;
    case '2': groupText = 'Pemrograman & rekayasa perangkat lunak'; break;
    case '3': groupText = 'Pengolahan informasi cerdas'; break;
    case '4': groupText = 'Komputasi & algoritma'; break;
    case '5': groupText = 'Arsitektur & infrastruktur'; break;
    case '6': groupText = 'Sistem perusahaan'; break;
    case '7': groupText = 'Teknologi informasi'; break;
    case '8': groupText = 'Sistem informasi & aplikasi'; break;
    case '9': groupText = 'Kepribadian & keterampilan berkarya'; break;
    default: groupText = `Kelompok disiplin ilmu kode ${groupChar}`;
  }
  breakdown.push({
    label: 'Karakter 9',
    value: groupChar,
    explanation: `Kelompok disiplin: ${groupText}.`,
  });

  // 7. Karakter 10 (Urutan)
  const seqChar = code.charAt(9);
  breakdown.push({
    label: 'Karakter 10',
    value: seqChar,
    explanation: `Urutan mata kuliah ke‑${seqChar} dalam kelompok disiplin tersebut.`,
  });

  return { isValid: true, breakdown, note };
}

export const CourseDrawer: React.FC<CourseDrawerProps> = ({ courses }) => {
  const selectedCourseId = useCurriculumStore((state) => state.selectedCourseId);
  const setSelectedCourseId = useCurriculumStore((state) => state.setSelectedCourseId);

  const course = selectedCourseId ? courses[selectedCourseId] : null;

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedCourseId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedCourseId]);

  const codeAnalysis = course ? parseCourseCode(course.code) : null;

  return (
    <aside
      className={`fixed top-0 right-0 h-screen w-96 bg-[#1E1E1E] border-l border-[#333333] z-50 flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.5)] transition-transform duration-200 ease-out transform
        ${course ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start p-6 border-b border-[#333333] shrink-0">
        <div>
          <span className="font-mono text-xs font-bold tracking-wider text-[#C5A059] block mb-1">
            {course?.code}
          </span>
          {course?.name && (
            <h2 className="font-sans text-[22px] font-bold text-[#F8FAFC] leading-snug">
              {course.name}
            </h2>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2.5 py-0.5 rounded bg-[#333333] text-[#F8FAFC]">
              {course?.credits} SKS
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded border border-[#333333] text-[#E2E8F0]">
              {course?.state}
            </span>
          </div>
        </div>
        <button
          onClick={() => setSelectedCourseId(null)}
          className="text-[#E2E8F0] hover:text-[#C5A059] p-2 hover:bg-[#333333] rounded transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
        {course ? (
          <>
            {/* Description */}
            <div>
              <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                Deskripsi
              </h4>
              <p className="font-sans text-sm text-[#E2E8F0] leading-relaxed">
                {course.description || 'Tidak ada deskripsi tersedia.'}
              </p>
            </div>

            {/* Course Code Breakdown Section */}
            {codeAnalysis && codeAnalysis.isValid && (
              <div>
                <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                  Makna Kode Mata Kuliah
                </h4>
                <div className="space-y-3">
                  <div className="space-y-2 border border-[#333333] rounded p-2.5 bg-[#151515]">
                    {codeAnalysis.breakdown.map((item, idx) => (
                      <div key={idx} className="flex gap-2 text-xs font-sans">
                        <div className="font-mono text-[#C5A059] bg-[#222222] px-1 py-0.5 rounded shrink-0 min-w-[36px] text-center h-fit border border-[#333333]">
                          {item.value}
                        </div>
                        <div className="text-[#E2E8F0]/90">
                          <span className="font-bold text-[#F8FAFC] block">{item.label}</span>
                          {item.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#E2E8F0]/50 italic leading-normal">
                    {codeAnalysis.note}
                  </p>
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                  Prasyarat
                </h4>
                <div className="flex flex-wrap gap-2">
                  {course.prerequisites.map((prereq) => {
                    const isSoft = course.softPrerequisites?.includes(prereq);
                    return (
                      <button
                        key={prereq}
                        onClick={() => setSelectedCourseId(prereq)}
                        className={`font-mono text-xs px-3 py-1.5 bg-[#2A2A2A] border text-[#F8FAFC] rounded hover:border-[#C5A059] transition-colors duration-200 cursor-pointer min-h-[36px] flex items-center gap-1.5
                          ${isSoft ? 'border-dashed border-[#C5A059]/60' : 'border-[#333333]'}
                        `}
                      >
                        <span>{prereq}</span>
                        {isSoft && (
                          <span className="text-[10px] text-[#C5A059] font-sans font-normal">(Lunak)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Topics */}
            {course.topics && course.topics.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                  Pokok Bahasan
                </h4>
                <ul className="space-y-2">
                  {course.topics.map((topic, index) => (
                    <li key={index} className="flex items-start text-sm text-[#E2E8F0]">
                      <span className="text-[#C5A059] mr-2.5 mt-1 select-none">•</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Learning Outcomes */}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                  Capaian Pembelajaran (CPL)
                </h4>
                <ul className="space-y-2">
                  {course.learningOutcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start text-sm text-[#E2E8F0]">
                      <span className="text-[#C5A059] mr-2.5 mt-1 select-none">•</span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sublearning Outcomes */}
            {course.sublearningOutcomes && course.sublearningOutcomes.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                  Sub-Capaian Pembelajaran
                </h4>
                <ul className="space-y-2">
                  {course.sublearningOutcomes.map((sub, index) => (
                    <li key={index} className="flex items-start text-sm text-[#E2E8F0]">
                      <span className="text-[#C5A059] mr-2.5 mt-1 select-none">•</span>
                      <span>{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resources */}
            {course.resources && course.resources.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                  Pustaka & Alat
                </h4>
                <ul className="space-y-2">
                  {course.resources.map((resource, index) => (
                    <li key={index} className="flex items-start text-sm text-[#E2E8F0]">
                      <span className="text-[#C5A059] mr-2.5 mt-1 select-none">•</span>
                      <span>{resource}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisite of (Immediate Successors) */}
            {(() => {
              const successors = Object.values(courses).filter(
                (c) => c.prerequisites && c.prerequisites.includes(selectedCourseId || '')
              );
              if (successors.length === 0) return null;
              return (
                <div>
                  <h4 className="flex items-center gap-2 font-sans text-xs font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333333] pb-1.5 mb-3">
                    Prasyarat Untuk
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {successors.map((succ) => (
                      <button
                        key={succ.code}
                        onClick={() => setSelectedCourseId(succ.code)}
                        className="font-mono text-xs px-3 py-1.5 bg-[#2A2A2A] border border-[#333333] text-[#F8FAFC] rounded hover:border-[#C5A059] transition-colors duration-200 cursor-pointer min-h-[36px]"
                      >
                        {succ.code}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-[#E2E8F0]/50 text-sm">
            Pilih mata kuliah untuk melihat detail.
          </div>
        )}
      </div>
    </aside>
  );
};
