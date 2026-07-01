import React from 'react';
import { Search, Settings, HelpCircle } from 'lucide-react';
import { useCurriculumStore } from '@/store/useCurriculumStore';
import { useReactFlow } from 'reactflow';

export const TopNav: React.FC = () => {
  const activeMajor = useCurriculumStore((state) => state.activeMajor);
  const setActiveMajor = useCurriculumStore((state) => state.setActiveMajor);
  const searchQuery = useCurriculumStore((state) => state.searchQuery);
  const setSearchQuery = useCurriculumStore((state) => state.setSearchQuery);
  const { fitView } = useReactFlow();

  const handleMajorChange = (major: 'CS' | 'IS') => {
    setActiveMajor(major);
    // Give layout engine a tiny moment to calculate before fitting view
    setTimeout(() => {
      fitView({ duration: 800, padding: 0.2 });
    }, 50);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-6 h-16 bg-[#1E1E1E] border-b border-[#333333]">
      <div className="flex items-center gap-6">
        {/* Brand/Faculty Logo */}
        <div className="text-xl font-sans font-bold text-[#F8FAFC]">
          CSUI <span className="text-[#C5A059] font-normal">Curriculum Map</span>
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
            Computer Science (CS)
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
            Information Systems (IS)
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

        {/* Auxiliary Controls */}
        <button
          className="p-2 text-[#E2E8F0] hover:text-[#C5A059] hover:bg-[#333333] rounded-full transition-colors duration-200 flex items-center justify-center min-w-[44px] min-h-[44px]"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          className="p-2 text-[#E2E8F0] hover:text-[#C5A059] hover:bg-[#333333] rounded-full transition-colors duration-200 flex items-center justify-center min-w-[44px] min-h-[44px]"
          aria-label="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
