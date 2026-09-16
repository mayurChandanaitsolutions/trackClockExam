import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtext: string;
  icon: React.ReactNode;
  iconBg: string;
  titleColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon,
  iconBg,
  titleColor,
}) => {
  return (
    <div className="stat-card">
      <div className="stat-card-left">
        <div className="stat-icon-wrapper" style={{ backgroundColor: iconBg }}>
          {icon}
        </div>
      </div>
      <div className="stat-card-content">
        <span className="stat-title" style={{ color: titleColor }}>
          {title}
        </span>
        <span className="stat-value">{value}</span>
        <span className="stat-subtext">{subtext}</span>
      </div>
    </div>
  );
};

export default StatCard;
