import React from 'react';

interface SemesterGroupNodeProps {
  id: string;
  data: {
    label: string;
  };
}

const SemesterGroupNode: React.FC<SemesterGroupNodeProps> = ({ data }) => {
  return (
    <div className="w-full h-full min-w-[280px] min-h-[140px] border border-dashed border-[#333333] bg-[#1E1E1E]/20 rounded-lg p-4 relative pointer-events-none">
      <div className="absolute top-2 left-3 text-xs font-bold text-[#C5A059] uppercase tracking-wider select-none">
        {data.label}
      </div>
    </div>
  );
};

export default React.memo(SemesterGroupNode);
