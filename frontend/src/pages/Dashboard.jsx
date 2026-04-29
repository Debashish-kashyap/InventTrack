import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getItems } from '../api/items';
import { getLogs, deleteLog, clearAllLogs } from '../api/logs';
import StatCard from '../components/StatCard';
import ItemTable from '../components/ItemTable';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsData, logsData] = await Promise.all([getItems(), getLogs()]);
      setItems(itemsData);
      setLogs(logsData);
    } catch (error) {
      const message =
        error?.code === 'ERR_CONNECTION_REFUSED' ||
        String(error?.message || '').includes('ECONNREFUSED') ||
        String(error?.message || '').toLowerCase().includes('refused')
          ? 'Backend is not reachable at http://localhost:5000/api. Make sure the backend server is running.'
          : null;
      
      const fallback =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load dashboard data';
      toast.error(message ?? fallback);
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      await deleteLog(id);
      setLogs(logs.filter(log => log.id !== id));
      toast.success('Log deleted');
    } catch (error) {
      toast.error('Failed to delete log');
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all activity logs?')) return;
    try {
      await clearAllLogs();
      setLogs([]);
      toast.success('All logs cleared');
    } catch (error) {
      toast.error('Failed to clear logs');
    }
  };

  const totalItems = items.length;
  const keyboardItems = items.filter(item => item.category === 'Keyboard').length;
  const mouseItems = items.filter(item => item.category === 'Mouse').length;
  const monitorItems = items.filter(item => item.category === 'Monitor').length;
  
  const workingItems = items.filter(item => item.condition === 'Working').length;
  const repairItems = items.filter(item => item.condition === 'Repair').length;
  const faultyItems = items.filter(item => item.condition === 'Faulty').length;

  const recentItems = [...items].sort((a, b) => {
    const bDate = b.createdAt ?? b.created_at ?? 0;
    const aDate = a.createdAt ?? a.created_at ?? 0;
    return new Date(bDate) - new Date(aDate);
  }).slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12">
      <div className="mb-8">
        <h1 className="font-page-title text-page-title text-slate-800">Dashboard Overview</h1>
        <p className="font-body-text text-body-text text-slate-500">Real-time status of your assets and inventory.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Items" value={totalItems} iconName="list_alt" />
        <StatCard title="Keyboards" value={keyboardItems} iconName="keyboard" />
        <StatCard title="Mice" value={mouseItems} iconName="mouse" />
        <StatCard title="Monitors" value={monitorItems} iconName="monitor" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Working */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 flex items-center gap-6 hover:shadow-lg transition-all duration-300">
          <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center border-2 border-emerald-500">
            <span className="material-symbols-outlined text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-800">{workingItems}</h3>
            <p className="font-body-text text-body-text text-emerald-700 font-semibold">Working Condition</p>
          </div>
        </div>
        
        {/* Repair */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 flex items-center gap-6 hover:shadow-lg transition-all duration-300">
          <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center border-2 border-amber-500">
            <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>build</span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-800">{repairItems}</h3>
            <p className="font-body-text text-body-text text-amber-700 font-semibold">Requires Repair</p>
          </div>
        </div>
        
        {/* Faulty */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 flex items-center gap-6 hover:shadow-lg transition-all duration-300">
          <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-500">
            <span className="material-symbols-outlined text-red-600" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-800">{faultyItems}</h3>
            <p className="font-body-text text-body-text text-red-700 font-semibold">Faulty / Out of Order</p>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Card */}
      {items.filter(i => (i.quantity || 0) < 3).length > 0 && (
        <div className="bg-red-50 rounded-2xl shadow-md border border-red-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <div>
              <h3 className="font-section-heading text-section-heading text-red-800">Low Stock Alert</h3>
              <p className="text-red-600 text-xs font-medium">{items.filter(i => (i.quantity || 0) < 3).length} item(s) below threshold of 3</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.filter(i => (i.quantity || 0) < 3).map(item => (
              <div key={item._id ?? item.id} className="bg-white rounded-xl p-4 border border-red-200 flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.brand} {item.model}</p>
                  <p className="text-xs text-red-600 font-bold">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-section-heading text-section-heading text-slate-800">Recent Items</h3>
          <Link to="/items" state={{ openAddModal: true }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform hover:opacity-90">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add New Item
          </Link>
        </div>
        {recentItems.length > 0 ? (
          <ItemTable 
            items={recentItems} 
            onEdit={() => toast.success('Go to Items page to edit')} 
            onDelete={() => toast.success('Go to Items page to delete')} 
          />
        ) : (
          <div className="p-8 text-center text-slate-500 font-body-text">
            No items added yet. Click "Add New Item" to get started.
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100 mt-8">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-section-heading text-section-heading text-slate-800">Activity Log</h3>
          {logs.length > 0 && (
            <button 
              onClick={handleClearLogs}
              className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
              Clear All
            </button>
          )}
        </div>
        <div className="divide-y divide-slate-100">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="group p-4 px-6 hover:bg-slate-50 transition-colors flex items-start gap-3">
                <div className="mt-0.5">
                  <span className="material-symbols-outlined text-indigo-400 text-[20px]">
                    {log.action === 'ADD_ITEM' || log.action === 'ADD_ROOM' ? 'add_circle' : 
                     log.action === 'EDIT_ITEM' ? 'edit' : 'delete'}
                  </span>
                </div>
                <div>
                  <p className="font-body-text text-slate-800">{log.message}</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    {new Date(log.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                    , {new Date(log.created_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit'
                    }).toLowerCase()}
                  </p>
                </div>
                <div className="ml-auto flex items-center">
                  <button 
                    onClick={() => handleDeleteLog(log.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete log entry"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500 font-body-text">
              No activity logs recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
