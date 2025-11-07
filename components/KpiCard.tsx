import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, icon, onClick, isActive = false }) => {
  
  const classNames = [
    "border rounded-xl p-4 min-h-[88px] shadow-md flex items-center gap-4 transition-all duration-200 ease-in-out",
    "bg-white dark:bg-[#3a475b] border-slate-200 dark:border-slate-700 shadow-slate-600/5 dark:shadow-black/10 hover:shadow-lg hover:shadow-slate-600/10 hover:dark:shadow-black/20",
    onClick ? "cursor-pointer" : "",
    (onClick && !isActive) ? "hover:transform hover:-translate-y-1" : "",
    isActive ? "ring-4 ring-orange-400/70 ring-offset-4 ring-offset-gray-100 dark:ring-offset-[#2d3748]" : ""
  ].filter(Boolean).join(" ");


  return (
    <div className={classNames} onClick={onClick}>
      <div className={`w-10 h-10 rounded-lg grid place-items-center flex-shrink-0 bg-orange-100/70 text-[#FD7F08]`}>
        {icon}
      </div>
      <div>
        <div className={`text-sm text-slate-500 dark:text-slate-400`}>{title}</div>
        <div className="text-2xl font-bold leading-tight mt-0.5 text-slate-700 dark:text-white">{value}</div>
        <div className={`text-xs mt-0.5 text-slate-500 dark:text-slate-400`}>{subtitle}</div>
      </div>
    </div>
  );
};

export default KpiCard;