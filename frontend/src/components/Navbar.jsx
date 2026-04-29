import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getItems } from '../api/items';

const LOW_STOCK_THRESHOLD = 3;

const Navbar = () => {
  const location = useLocation();
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Inventory', path: '/items' },
    { name: 'Rooms', path: '/rooms' },
  ];

  useEffect(() => {
    fetchAlerts();
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAlerts(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAlerts = async () => {
    try {
      const items = await getItems();
      const low = items.filter(i => (i.quantity || 0) < LOW_STOCK_THRESHOLD);
      setLowStockItems(low);
    } catch {
      // silently fail — navbar should not block
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600">inventory_2</span>
          <span>InvenTrack</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/');
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`font-inter text-sm font-medium h-16 flex items-center transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 pb-1'
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-500'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {/* Bell Icon with Alert Badge */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:opacity-80 duration-150 relative"
          >
            <span className="material-symbols-outlined text-slate-600">notifications</span>
            {lowStockItems.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                {lowStockItems.length}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showAlerts && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h4 className="font-semibold text-slate-800 text-sm">Low Stock Alerts</h4>
                {lowStockItems.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                    {lowStockItems.length} items
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {lowStockItems.length === 0 ? (
                  <div className="px-5 py-6 text-center text-slate-500 text-sm">
                    <span className="material-symbols-outlined text-slate-300 text-3xl mb-2 block">check_circle</span>
                    All items are sufficiently stocked.
                  </div>
                ) : (
                  lowStockItems.map(item => (
                    <div key={item._id ?? item.id} className="px-5 py-3 hover:bg-red-50/50 transition-colors flex items-start gap-3">
                      <span className="material-symbols-outlined text-red-500 mt-0.5 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.brand} {item.model}</p>
                        <p className="text-xs text-red-600 font-semibold mt-0.5">
                          Only {item.quantity} left — below threshold of {LOW_STOCK_THRESHOLD}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {lowStockItems.length > 0 && (
                <Link
                  to="/items"
                  onClick={() => setShowAlerts(false)}
                  className="block px-5 py-3 text-center text-xs font-semibold text-indigo-600 bg-slate-50 border-t border-slate-100 hover:bg-indigo-50 transition-colors"
                >
                  View all in Inventory →
                </Link>
              )}
            </div>
          )}
        </div>
        <button className="p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:opacity-80 duration-150">
          <span className="material-symbols-outlined text-slate-600">account_circle</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
