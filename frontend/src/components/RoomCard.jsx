import React from 'react';

const RoomCard = ({ room, onClick }) => {
  return (
    <div 
      className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-lg transition-all duration-300 group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
            {room.name}
          </h3>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            {room.location || 'No location specified'}
          </p>
        </div>
        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
          {room.items?.length || 0} Items
        </span>
      </div>
    </div>
  );
};

export default RoomCard;
