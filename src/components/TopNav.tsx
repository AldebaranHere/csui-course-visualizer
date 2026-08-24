import React, { useState } from 'react';
import { Search, HelpCircle, X, User } from 'lucide-react';
import { useCurriculumStore } from '@/store/useCurriculumStore';
import { useReactFlow } from 'reactflow';
import { PROGRAM_REGISTRY } from '@/data/programRegistry';
import { StudyProgram } from '@/types/curriculum';

export const TopNav: React.FC = () => {
  const activeProgram = useCurriculumStore((state) => state.activeProgram);
  const setActiveProgram = useCurriculumStore((state) => state.setActiveProgram);
  const searchQuery = useCurriculumStore((state) => state.searchQuery);
  const setSearchQuery = useCurriculumStore((state) => state.setSearchQuery);
  const { fitView } = useReactFlow();
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const handleProgramChange = (program: StudyProgram) => {
    setActiveProgram(program);
    // Give layout engine a tiny moment to calculate before fitting view
    setTimeout(() => {
      fitView({ duration: 800, padding: 0.2 });
    }, 50);
  };

  interface FAQItem {
    q: string;
    a: React.ReactNode;
  }

  const faqData: FAQItem[] = [
    {
      q: 'Bagaimana cara membaca peta kurikulum ini?',
      a: 'Setiap kotak melambangkan satu mata kuliah. Garis panah menunjukkan hubungan prasyarat: mata kuliah di pangkal panah harus diselesaikan sebelum mengambil mata kuliah di ujung panah.'
    },
    {
      q: 'Apa arti dari penyorotan (highlight) saat mata kuliah diklik?',
      a: 'Ketika Anda mengklik sebuah mata kuliah, jalurnya akan disorot secara otomatis: semua mata kuliah prasyarat (sebelumnya) akan diberi warna latar belakang yang berbeda, dan semua mata kuliah turunan (yang membutuhkan mata kuliah ini) akan disorot dengan warna kuning.'
    },
    {
      q: 'Apa arti dari label "PR" di pojok kanan bawah beberapa kotak mata kuliah?',
      a: '"PR" merupakan singkatan dari Prasyarat (Prerequisites). Angka di sebelah label "PR" menunjukkan total jumlah mata kuliah prasyarat yang wajib diselesaikan sebelum Anda dapat mengambil mata kuliah tersebut.'
    },
    {
      q: 'Bagaimana cara membaca kode mata kuliah (format 10 karakter)?',
      a: (
        <div className="space-y-2 mt-1">
          <div>Kode mata kuliah 10 karakter memiliki struktur sistematis berikut:</div>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Karakter 1–4:</strong> Kode Universitas/Fakultas/Prodi (contoh: <code>UIGE</code> = wajib universitas; <code>CS</code> = Ilmu Komputer; karakter ke-3 <code>C</code> = Ilmu Komputer, <code>I</code> = Sistem Informasi; karakter ke-4 <code>M</code> = wajib, <code>E</code> = pilihan).</li>
            <li><strong>Karakter 5:</strong> Level KKNI (<code>6</code> = Sarjana S1).</li>
            <li><strong>Karakter 6:</strong> Jenis kelas/bahasa pengantar (<code>0</code> = reguler/Bahasa Indonesia, <code>1</code> = internasional/KKI/Bahasa Inggris).</li>
            <li><strong>Karakter 7:</strong> Tahun kuliah ditawarkan (tahun ke-1, 2, 3, atau 4).</li>
            <li><strong>Karakter 8:</strong> Semester dibukanya mata kuliah (<code>0</code> = ganjil atau genap, <code>1</code> = ganjil, <code>2</code> = genap).</li>
            <li><strong>Karakter 9:</strong> Kelompok disiplin ilmu (contoh: <code>1</code> = Matematika, <code>2</code> = RPL, <code>3</code> = AI, <code>4</code> = Algoritma, <code>5</code> = Infrastruktur, <code>6</code> = Enterprise, <code>7</code> = TI, <code>8</code> = SI, <code>9</code> = Kepribadian).</li>
            <li><strong>Karakter 10:</strong> Urutan/indeks mata kuliah dalam kelompok tersebut.</li>
          </ul>
          <div className="text-xs text-[#E2E8F0]/50 italic mt-1">Catatan: Pola kode ini menunjukkan rancangan kurikulum secara umum dan tidak menjamin ketersediaan mata kuliah pada semester berjalan secara mutlak.</div>
        </div>
      )
    },
    {
      q: 'Bagaimana cara mencari mata kuliah?',
      a: 'Gunakan kolom "Cari mata kuliah..." di pojok kanan atas. Ketikkan nama atau kode mata kuliah. Semua mata kuliah yang tidak cocok akan otomatis meredup agar memudahkan pencarian Anda.'
    },
    {
      q: 'Bagaimana cara melihat detail lengkap mata kuliah?',
      a: 'Cukup klik salah satu mata kuliah. Panel informasi detail akan muncul dari sisi kanan layar, menampilkan deskripsi lengkap, beban SKS, jenis wajib/pilihan, prasyarat, pokok bahasan, serta capaian pembelajaran (CPL).'
    },
    {
      q: 'Bagaimana cara memperbesar, memperkecil, atau menggeser graf?',
      a: 'Gunakan scroll mouse atau cubit trackpad untuk memperbesar/memperkecil (zoom). Klik dan geser (drag) di area kosong pada layar untuk memindahkan (pan) tampilan peta kurikulum.'
    }
  ];

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-6 h-16 bg-[#1E1E1E] border-b border-[#333333]">
        <div className="flex items-center gap-6">
          {/* Brand/Faculty Logo */}
          <div className="text-xl font-sans font-bold text-[#F8FAFC]">
            Peta Mata Kuliah <span className="text-[#C5A059] font-normal">Fasilkom UI</span>
          </div>

          {/* Categorized Dropdown Selector */}
          <div className="relative min-w-[220px]">
            <select
              value={activeProgram}
              onChange={(e) => handleProgramChange(e.target.value as StudyProgram)}
              className="w-full bg-[#333333] border border-[#333333] text-[#F8FAFC] focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] focus:outline-none rounded-[4px] px-3 py-2 text-xs font-bold font-sans min-h-[40px] cursor-pointer appearance-none bg-no-repeat bg-[right_12px_center] transition-all duration-200"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23E2E8F0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundSize: '16px',
              }}
            >
              <optgroup label="Program Reguler" className="bg-[#1E1E1E] text-[#E2E8F0] font-sans font-normal">
                {Object.entries(PROGRAM_REGISTRY)
                  .filter(([, entry]) => entry.category === 'Reguler')
                  .map(([key, entry]) => (
                    <option key={key} value={key} className="bg-[#1E1E1E] text-[#F8FAFC] py-2">
                      {entry.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Program KKI" className="bg-[#1E1E1E] text-[#E2E8F0] font-sans font-normal">
                {Object.entries(PROGRAM_REGISTRY)
                  .filter(([, entry]) => entry.category === 'KKI')
                  .map(([key, entry]) => (
                    <option key={key} value={key} className="bg-[#1E1E1E] text-[#F8FAFC] py-2">
                      {entry.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-[#E2E8F0] w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mata kuliah..."
              className="bg-transparent border border-[#333333] text-[#F8FAFC] placeholder:text-[#E2E8F0]/50 rounded-[4px] py-2 pl-9 pr-4 text-sm focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] focus:outline-none w-64 transition-all duration-200 font-sans min-h-[44px]"
            />
          </div>

          {/* FAQ Button */}
          <button
            onClick={() => setIsFaqOpen(true)}
            className="px-4 py-2 border border-[#333333] hover:border-[#C5A059] text-xs font-bold text-[#E2E8F0] hover:text-[#C5A059] bg-[#2A2A2A] hover:bg-[#333333] rounded-[4px] transition-all duration-200 flex items-center gap-2 min-h-[44px] cursor-pointer"
            aria-label="FAQ"
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQ</span>
          </button>

          {/* Contact Developer Button */}
          <button
            onClick={() => setIsContactOpen(true)}
            className="px-4 py-2 border border-[#333333] hover:border-[#C5A059] text-xs font-bold text-[#E2E8F0] hover:text-[#C5A059] bg-[#2A2A2A] hover:bg-[#333333] rounded-[4px] transition-all duration-200 flex items-center gap-2 min-h-[44px] cursor-pointer"
            aria-label="Hubungi Developer"
          >
            <User className="w-4 h-4" />
            <span>Kontak</span>
          </button>
        </div>
      </header>

      {/* FAQ Modal */}
      {isFaqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#1E1E1E] border border-[#333333] w-full max-w-xl rounded-[4px] shadow-2xl p-6 relative flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsFaqOpen(false)}
              className="absolute top-4 right-4 text-[#E2E8F0] hover:text-[#C5A059] p-2 rounded hover:bg-[#333333] transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Tutup FAQ"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-sans text-xl font-bold text-[#F8FAFC] border-b border-[#333333] pb-3.5 mb-4">
              FAQ & Panduan Penggunaan Peta Kurikulum
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar text-sm text-[#E2E8F0]">
              {faqData.map((item, index) => (
                <div key={index} className="space-y-1.5">
                  <h4 className="font-sans font-bold text-[#C5A059] flex items-start gap-2">
                    <span className="select-none font-mono text-xs bg-[#333333] text-[#F8FAFC] px-1.5 py-0.5 rounded shrink-0">Q</span>
                    <span>{item.q}</span>
                  </h4>
                  <div className="font-sans text-sm text-[#E2E8F0]/90 leading-relaxed pl-8">
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contact Developer Modal */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#1E1E1E] border border-[#333333] w-full max-w-md rounded-[4px] shadow-2xl p-6 relative flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsContactOpen(false)}
              className="absolute top-4 right-4 text-[#E2E8F0] hover:text-[#C5A059] p-2 rounded hover:bg-[#333333] transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Tutup Kontak"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-sans text-xl font-bold text-[#F8FAFC] border-b border-[#333333] pb-3.5 mb-4">
              Hubungi Developer
            </h3>
            
            <div className="space-y-4 text-[#E2E8F0]">
              <div className="flex items-center gap-3 p-3 bg-[#2A2A2A] rounded border border-[#333333]">
                <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/25 flex items-center justify-center text-[#C5A059] font-sans font-bold shrink-0">
                  AR
                </div>
                <div>
                  <h4 className="font-sans font-bold text-sm text-[#F8FAFC]">Aldebaran Rahman Adhitya</h4>
                  <span className="text-xs text-[#E2E8F0]/65">Developer</span>
                </div>
              </div>
              
              <div className="space-y-3.5 pt-2">
                <a href="https://aldebaran-portfolio.web.app/"
                target="_blank"
                className="flex items-center gap-3 text-sm hover:text-[#C5A059] transition-colors group"
                >
                  <span className="font-sans font-bold text-[#C5A059] w-20 shrink-0">Portfolio:</span>
                  <span>aldebaran-portfolio.web.app</span>
                </a>
                <a
                  href="mailto:aldebaran26adhitya@gmail.com"
                  className="flex items-center gap-3 text-sm hover:text-[#C5A059] transition-colors group"
                >
                  <span className="font-sans font-bold text-[#C5A059] w-20 shrink-0">Email:</span>
                  <span>aldebaran26adhitya@gmail.com</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/aldebaran-adhitya-118840210/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm hover:text-[#C5A059] transition-colors group"
                >
                  <span className="font-sans font-bold text-[#C5A059] w-20 shrink-0">LinkedIn:</span>
                  <span>linkedin.com/in/aldebaran-adhitya-118840210/</span>
                </a>

                <a
                  href="https://github.com/AldebaranHere"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm hover:text-[#C5A059] transition-colors group"
                >
                  <span className="font-sans font-bold text-[#C5A059] w-20 shrink-0">GitHub:</span>
                  <span>github.com/AldebaranHere</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
