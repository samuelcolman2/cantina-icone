
import React from 'react';

interface PieChartProps {
  data: { value: number; color: string }[];
  size?: number;
}

const PieChart: React.FC<PieChartProps> = ({ data, size = 160 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div style={{ width: size, height: size }} className="flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  const radius = size / 2;
  const center = radius;

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  let startAngle = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((item, index) => {
        const percent = item.value / total;
        const endAngle = startAngle + percent * 360;

        const start = polarToCartesian(center, center, radius, endAngle);
        const end = polarToCartesian(center, center, radius, startAngle);

        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

        const d = [
          'M', start.x, start.y,
          'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
          'L', center, center,
          'L', start.x, start.y,
        ].join(' ');

        // Label position
        const labelAngle = startAngle + (endAngle - startAngle) / 2;
        const labelRadius = radius * 0.65;
        const labelPos = polarToCartesian(center, center, labelRadius, labelAngle);
        
        const currentStartAngle = startAngle;
        startAngle = endAngle;

        return (
          <g key={index}>
            <path d={d} fill={item.color} />
            {percent > 0.07 && ( // Only show label for slices > 7%
               <text
                 x={labelPos.x}
                 y={labelPos.y}
                 fill="white"
                 fontSize={size * 0.08}
                 fontWeight="bold"
                 textAnchor="middle"
                 alignmentBaseline="central"
                 style={{ pointerEvents: 'none' }}
               >
                 {`${Math.round(percent * 100)}%`}
               </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default PieChart;
