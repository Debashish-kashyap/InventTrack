import React from 'react';

const StatCard = ({ title, value, iconName, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-md border-l-4 border-indigo-600 hover:shadow-lg transition-all duration-300 ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-label-caps text-label-caps text-slate-500 uppercase">{title}</p>
          <h2 className="text-3xl font-extrabold text-slate-800 mt-2">{value}</h2>
        </div>
        {iconName && (
          <span className="material-symbols-outlined text-indigo-600 bg-indigo-50 p-2 rounded-lg">
            {iconName}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
