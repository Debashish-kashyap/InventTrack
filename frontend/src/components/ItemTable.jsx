import React from 'react';

const LOW_STOCK_THRESHOLD = 3;

const ItemTable = ({ items, onEdit, onDelete, onTransfer }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 font-label-caps text-label-caps text-slate-500 uppercase tracking-wider">Item Name</th>
            <th className="px-6 py-4 font-label-caps text-label-caps text-slate-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-4 font-label-caps text-label-caps text-slate-500 uppercase tracking-wider">Quantity</th>
            <th className="px-6 py-4 font-label-caps text-label-caps text-slate-500 uppercase tracking-wider">Condition</th>
            <th className="px-6 py-4 font-label-caps text-label-caps text-slate-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-body-text">
                No items found.
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const isLowStock = (item.quantity || 0) < LOW_STOCK_THRESHOLD;
              return (
              <tr key={item._id ?? item.id} className={`transition-colors ${isLowStock ? 'bg-red-50/60 hover:bg-red-100/60' : 'hover:bg-slate-50'}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="font-body-text text-slate-800 font-medium">{item.brand} {item.model}</div>
                    {isLowStock && (
                      <span className="material-symbols-outlined text-red-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }} title="Low stock">warning</span>
                    )}
                  </div>
                  <div className="font-body-text text-slate-500 font-mono text-xs mt-1">
                    {item.room?.name ?? (item.room_id ? 'Assigned' : 'Unassigned')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg uppercase">
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {isLowStock ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">
                      {item.quantity}
                      <span className="text-[10px] font-semibold">LOW</span>
                    </span>
                  ) : (
                    <span className="font-body-text text-slate-500 font-mono text-xs">{item.quantity}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {item.condition === 'Working' && <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">{item.condition}</span>}
                  {item.condition === 'Repair' && <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg">{item.condition}</span>}
                  {item.condition === 'Faulty' && <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg">{item.condition}</span>}
                  {!['Working', 'Repair', 'Faulty'].includes(item.condition) && <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">{item.condition || 'Unknown'}</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {onTransfer && (
                      <button onClick={() => onTransfer(item)} className="p-1 hover:bg-blue-50 text-blue-600 rounded active:scale-95 transition-all" title="Transfer to another room">
                        <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                      </button>
                    )}
                    <button onClick={() => onEdit(item)} className="p-1 hover:bg-indigo-50 text-indigo-600 rounded active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button onClick={() => onDelete(item._id ?? item.id)} className="p-1 hover:bg-red-50 text-red-600 rounded active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ItemTable;
