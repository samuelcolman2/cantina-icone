import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  isActive?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, icon, variant = 'primary', onClick, isActive = false }) => {
  
  const variantClasses = {
    primary: "bg-[#FD7F08] text-white border-[#FD7F08] shadow-orange-600/20",
    secondary: "bg-white text-slate-700 border-slate-200 shadow-slate-600/5 hover:shadow-lg hover:shadow-slate-600/10"
  };

  const iconVariantClasses = {
    primary: "bg-white/20 text-white",
    secondary: "bg-orange-100/70 text-[#FD7F08]"
  }
  
  const classNames = [
    "border rounded-xl p-4 min-h-[88px] shadow-lg flex items-center gap-4 transition-all duration-200 ease-in-out",
    variantClasses[variant],
    onClick ? "cursor-pointer" : "",
    (onClick && !isActive) ? "hover:transform hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:shadow-orange-600/30" : "",
    isActive ? "ring-4 ring-orange-400/70 ring-offset-4 ring-offset-[#2d3748]" : ""
  ].filter(Boolean).join(" ");


  return (
    <div className={classNames} onClick={onClick}>
      <div className={`w-10 h-10 rounded-lg grid place-items-center flex-shrink-0 ${iconVariantClasses[variant]}`}>
        {icon}
      </div>
      <div>
        <div className={`text-sm ${variant === 'primary' ? 'text-white/95' : 'text-slate-500'}`}>{title}</div>
        <div className="text-2xl font-bold leading-tight mt-0.5">{value}</div>
        <div className={`text-xs mt-0.5 ${variant === 'primary' ? 'text-white/90' : 'text-slate-500'}`}>{subtitle}</div>
      </div>
    </div>
  );
};

export default KpiCard;