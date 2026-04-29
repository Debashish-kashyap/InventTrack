import { useState, useEffect } from 'react';
import { getRooms } from '../api/rooms';
import toast from 'react-hot-toast';

const ItemForm = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    category: '',
    brand: '',
    model: '',
    specifications: '',
    quantity: 1,
    condition: '',
    room: '',
    purchaseDate: ''
  });
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
      if (initialData) {
        setFormData({
          category: initialData.category || '',
          brand: initialData.brand || '',
          model: initialData.model || '',
          specifications: initialData.specifications || '',
          quantity: initialData.quantity || 1,
          condition: initialData.condition || '',
          room:
            initialData.room?._id ??
            initialData.room?.id ??
            initialData.room_id ??
            initialData.roomId ??
            initialData.room ??
            '',
          purchaseDate: (initialData.purchaseDate ?? initialData.purchase_date)
            ? new Date((initialData.purchaseDate ?? initialData.purchase_date)).toISOString().split('T')[0]
            : ''
        });
      } else {
        setFormData({
          category: '',
          brand: '',
          model: '',
          specifications: '',
          quantity: 1,
          condition: '',
          room: '',
          purchaseDate: ''
        });
      }
    }
  }, [isOpen, initialData]);

  const fetchRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (error) {
      const connectionRefused =
        error?.code === 'ERR_CONNECTION_REFUSED' ||
        String(error?.message || '').includes('ECONNREFUSED') ||
        String(error?.message || '').toLowerCase().includes('refused');

      const message = connectionRefused
        ? 'Backend is not reachable at http://localhost:5000/api. Make sure the backend server is running.'
        : (error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          'Failed to load rooms');

      toast.error(message);
      console.error('Failed to load rooms:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const submitData = { ...formData };
      if (!submitData.condition) delete submitData.condition;
      if (!submitData.room) delete submitData.room;
      if (!submitData.purchaseDate) delete submitData.purchaseDate;
      if (!submitData.specifications) delete submitData.specifications;
      
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      const connectionRefused =
        error?.code === 'ERR_CONNECTION_REFUSED' ||
        String(error?.message || '').includes('ECONNREFUSED') ||
        String(error?.message || '').toLowerCase().includes('refused');

      const message = connectionRefused
        ? 'Backend is not reachable at http://localhost:5000/api. Make sure the backend server is running.'
        : (error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          'Failed to submit item');

      toast.error(message);
      console.error('Submit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] flex flex-col">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface">
            {initialData ? 'Edit Item' : 'Add New Inventory Item'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form id="itemForm" onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase font-label-caps">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
              >
                <option value="">Select Category</option>
                <option value="Keyboard">Keyboard</option>
                <option value="Mouse">Mouse</option>
                <option value="Monitor">Monitor</option>
                <option value="CPU">CPU</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase font-label-caps">Brand *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. Dell"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase font-label-caps">Model *</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. XPS 15"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase font-label-caps">Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase font-label-caps">Condition</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
              >
                <option value="">Select Condition</option>
                <option value="Working">Working</option>
                <option value="Faulty">Faulty</option>
                <option value="Repair">Repair</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase font-label-caps">Room Location</label>
              <select
                name="room"
                value={formData.room}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
              >
                <option value="">Select Room</option>
                {rooms.map(room => (
                  <option key={room._id ?? room.id} value={room._id ?? room.id}>{room.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase font-label-caps">Purchase Date</label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase font-label-caps">Specifications</label>
              <textarea
                name="specifications"
                value={formData.specifications}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                placeholder="Additional details..."
              ></textarea>
            </div>
          </div>
          
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (initialData ? 'Update Item' : 'Add Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemForm;
