import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getItems, createItem, updateItem, deleteItem, transferItem } from '../api/items';
import { getRooms } from '../api/rooms';
import ItemTable from '../components/ItemTable';
import ItemForm from '../components/ItemForm';
import toast from 'react-hot-toast';
import { exportInventoryPDF } from '../utils/exportPDF';

const Items = () => {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Transfer modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferringItem, setTransferringItem] = useState(null);
  const [targetRoomId, setTargetRoomId] = useState('');
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  useEffect(() => {
    fetchData();
    if (location.state?.openAddModal) {
      setIsModalOpen(true);
      window.history.replaceState({}, document.title)
    }
  }, [location]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsData, roomsData] = await Promise.all([
        getItems(),
        getRooms()
      ]);
      setItems(itemsData);
      setRooms(roomsData);
    } catch (error) {
      const connectionRefused =
        error?.code === 'ERR_CONNECTION_REFUSED' ||
        String(error?.message || '').includes('ECONNREFUSED') ||
        String(error?.message || '').toLowerCase().includes('refused');

      const message =
        connectionRefused
          ? 'Backend is not reachable at http://localhost:5000/api. Make sure the backend server is running.'
          : error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message ||
            'Failed to load items';
      toast.error(message);
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (itemData) => {
    try {
      if (editingItem) {
        const editingId = editingItem._id ?? editingItem.id;
        await updateItem(editingId, itemData);
        toast.success('Item updated successfully');
      } else {
        await createItem(itemData);
        toast.success('Item added successfully');
      }
      fetchData();
    } catch (error) {
      const connectionRefused =
        error?.code === 'ERR_CONNECTION_REFUSED' ||
        String(error?.message || '').includes('ECONNREFUSED') ||
        String(error?.message || '').toLowerCase().includes('refused');

      const message =
        connectionRefused
          ? 'Backend is not reachable at http://localhost:5000/api. Make sure the backend server is running.'
          : error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message ||
            (editingItem ? 'Failed to update item' : 'Failed to add item');
      toast.error(message);
      console.error('Create/Update failed:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id);
        toast.success('Item deleted successfully');
        fetchData();
      } catch (error) {
        const message =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          'Failed to delete item';
        toast.error(message);
        console.error('Delete failed:', error);
      }
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openTransferModal = (item) => {
    setTransferringItem(item);
    setTargetRoomId('');
    setTransferModalOpen(true);
  };

  const handleTransfer = async () => {
    if (!targetRoomId) {
      toast.error('Please select a target room');
      return;
    }
    try {
      const itemId = transferringItem._id ?? transferringItem.id;
      await transferItem(itemId, targetRoomId);
      toast.success('Item transferred successfully');
      setTransferModalOpen(false);
      setTransferringItem(null);
      fetchData();
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to transfer item';
      toast.error(message);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      (item.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.model?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
    const matchesCondition = conditionFilter ? item.condition === conditionFilter : true;
    
    const itemRoomId =
      item.room?._id ??
      item.room?.id ??
      item.room_id ??
      item.roomId ??
      item.room ??
      null;
    // `roomFilter` comes from a `<select>` so it's always a string.
    const matchesRoom = roomFilter ? String(itemRoomId ?? '') === String(roomFilter) : true;

    return matchesSearch && matchesCategory && matchesCondition && matchesRoom;
  });

  return (
    <div className="pt-24 pb-12 space-y-8">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-page-title leading-tight tracking-tight">Inventory Items</h1>
          <p className="text-on-surface-variant font-body-text text-sm">Manage and track your assets across all rooms.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              try {
                exportInventoryPDF(items);
                toast.success('PDF exported successfully');
              } catch (err) {
                toast.error('Failed to export PDF');
                console.error(err);
              }
            }}
            className="flex items-center justify-center gap-2 bg-white text-indigo-600 border border-indigo-200 px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-indigo-50 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Export PDF
          </button>
          <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md hover:brightness-110 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add New Item
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <section className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Search by brand or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none bg-slate-50"
          >
            <option value="">Category: All</option>
            <option value="Keyboard">Keyboard</option>
            <option value="Mouse">Mouse</option>
            <option value="Monitor">Monitor</option>
            <option value="CPU">CPU</option>
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none bg-slate-50"
          >
            <option value="">Condition: All</option>
            <option value="Working">Working</option>
            <option value="Faulty">Faulty</option>
            <option value="Repair">Repair</option>
          </select>

          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none bg-slate-50"
          >
            <option value="">Room: All</option>
            {rooms.map(room => (
              <option key={room._id ?? room.id} value={room._id ?? room.id}>{room.name}</option>
            ))}
          </select>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <section className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
          <ItemTable 
            items={filteredItems} 
            onEdit={openEditModal} 
            onDelete={handleDelete}
            onTransfer={openTransferModal}
          />
        </section>
      )}

      <ItemForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingItem}
      />

      {/* Transfer Modal */}
      {transferModalOpen && transferringItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-surface">Transfer Item</h2>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Moving</p>
                <p className="font-semibold text-slate-800 mt-1">
                  {transferringItem.brand} {transferringItem.model}
                </p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  Currently in: {transferringItem.room?.name || 'Unassigned'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase font-label-caps">Transfer to Room *</label>
                <select
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                >
                  <option value="">Select destination room</option>
                  {rooms
                    .filter(r => {
                      const currentRoomId = transferringItem.room?._id ?? transferringItem.room?.id ?? transferringItem.room_id;
                      return String(r._id ?? r.id) !== String(currentRoomId);
                    })
                    .map(room => (
                      <option key={room._id ?? room.id} value={room._id ?? room.id}>{room.name}</option>
                    ))
                  }
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all"
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
