
import React from 'react';

const Spinner: React.FC<{ fullScreen?: boolean }> = ({ fullScreen = false }) => {
  const containerClasses = fullScreen
    ? "fixed inset-0 bg-gray-100/80 backdrop-blur-sm dark:bg-[#2d3748]/80 flex items-center justify-center z-50"
    : "flex items-center justify-center p-4";

  return (
    <div className={containerClasses}>
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#FD7F08]"></div>
    </div>
  );
};

export default Spinner;