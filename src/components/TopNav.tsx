import React, { useState } from 'react';
import { Search, HelpCircle, X } from 'lucide-react';
import { useCurriculumStore } from '@/store/useCurriculumStore';
import { useReactFlow } from 'reactflow';

export const TopNav: React.FC = () => {
  const activeMajor = useCurriculumStore((state) => state.activeMajor);
  const setActiveMajor = useCurriculumStore((state) => state.setActiveMajor);
  const searchQuery = useCurriculumStore((state) => state.searchQuery);
  const setSearchQuery = useCurriculumStore((state) => state.setSearchQuery);
  const { fitView } = useReactFlow();
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  const handleMajorChange = (major: 'CS' | 'IS') => {
    setActiveMajor(major);
    // Give layout engine a tiny moment to calculate before fitting view
    setTimeout(() => {
      fitView({ duration: 800, padding: 0.2 });
    }, 50);
  };

  const faqData = [
    {
      q: 'Bagaimana cara membaca peta kurikulum ini?',
      a: 'Setiap kotak melambangkan satu mata kuliah. Garis panah menunjukkan hubungan prasyarat: mata kuliah di pangkal panah harus diselesaikan sebelum mengambil mata kuliah di ujung panah.'
    },
    {
      q: 'Apa arti dari penyorotan (highlight) saat mata kuliah diklik?',
      a: 'Ketika Anda mengklik sebuah mata kuliah, jalurnya akan disorot secara otomatis: semua mata kuliah prasyarat (sebelumnya) akan diberi warna latar belakang yang berbeda, dan semua mata kuliah turunan (yang membutuhkan mata kuliah ini) akan disorot dengan warna kuning.'
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
            CSUI <span className="text-[#C5A059] font-normal">Peta Mata Kuliah</span>
          </div>

          {/* Major Selector Segmented Control */}
          <div className="flex bg-[#333333] rounded-[4px] p-0.5 min-h-[40px] items-center">
            <button
              onClick={() => handleMajorChange('CS')}
              className={`px-4 py-1.5 rounded-[4px] font-sans text-xs font-bold transition-all duration-200 cursor-pointer min-h-[36px] flex items-center justify-center
                ${activeMajor === 'CS'
                  ? 'bg-[#C5A059] text-[#111111]'
                  : 'text-[#E2E8F0] hover:bg-[#1E1E1E]'
                }
              `}
            >
              Ilmu Komputer (IK)
            </button>
            <button
              onClick={() => handleMajorChange('IS')}
              className={`px-4 py-1.5 rounded-[4px] font-sans text-xs font-bold transition-all duration-200 cursor-pointer min-h-[36px] flex items-center justify-center
                ${activeMajor === 'IS'
                  ? 'bg-[#C5A059] text-[#111111]'
                  : 'text-[#E2E8F0] hover:bg-[#1E1E1E]'
                }
              `}
            >
              Sistem Informasi (SI)
            </button>
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
                  <p className="font-sans text-sm text-[#E2E8F0]/90 leading-relaxed pl-8">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
