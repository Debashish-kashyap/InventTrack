import { useState, useEffect } from 'react';
import { getRooms, createRoom } from '../api/rooms';
import { getItems } from '../api/items';
import RoomCard from '../components/RoomCard';
import ItemTable from '../components/ItemTable';
import toast from 'react-hot-toast';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomItems, setRoomItems] = useState([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', location: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      const selectedRoomId = selectedRoom._id ?? selectedRoom.id;
      const filtered = items.filter(item => {
        const itemRoomId = item.room?._id ?? item.room?.id ?? item.room_id ?? item.roomId ?? item.room ?? null;
        return String(itemRoomId ?? '') === String(selectedRoomId ?? '');
      });
      setRoomItems(filtered);
    }
  }, [selectedRoom, items]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsData, itemsData] = await Promise.all([
        getRooms(),
        getItems()
      ]);
      setRooms(roomsData);
      setItems(itemsData);
      
      if (selectedRoom) {
        const selectedRoomId = selectedRoom._id ?? selectedRoom.id;
        const updatedRoom = roomsData.find(r => String(r._id ?? r.id) === String(selectedRoomId));
        if (updatedRoom) setSelectedRoom(updatedRoom);
      }
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load rooms data';
      toast.error(message);
      console.error('Failed to load rooms data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.name) {
      toast.error('Room name is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createRoom(newRoom);
      toast.success('Room created successfully');
      setNewRoom({ name: '', location: '' });
      setIsAddModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoomItemCount = (roomId) => {
    return items.filter(item => {
      const id = item.room?._id || item.room;
      return id === roomId;
    }).length;
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (selectedRoom) {
    return (
      <div className="pt-24 pb-12 space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedRoom(null)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-on-surface font-page-title leading-tight tracking-tight">{selectedRoom.name}</h1>
            <p className="text-on-surface-variant font-body-text text-sm mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              {selectedRoom.location ? selectedRoom.location : 'No location specified'}
            </p>
          </div>
        </div>

        <section className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="font-section-heading text-section-heading text-slate-800">
              Items in {selectedRoom.name} ({roomItems.length})
            </h3>
          </div>
          <ItemTable 
            items={roomItems}
            onEdit={() => toast.success('Go to Items page to edit')}
            onDelete={() => toast.success('Go to Items page to delete')}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-page-title leading-tight tracking-tight">Rooms Management</h1>
          <p className="text-on-surface-variant font-body-text text-sm">Manage locations and assigned items.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md hover:brightness-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => (
          <RoomCard 
            key={room._id ?? room.id} 
            room={{...room, _id: room._id ?? room.id, items: { length: getRoomItemCount(room._id ?? room.id) }}} 
            onClick={() => setSelectedRoom({ ...room, _id: room._id ?? room.id })} 
          />
        ))}
        {rooms.length === 0 && (
          <div className="col-span-full p-8 text-center bg-white border border-slate-100 rounded-2xl text-slate-500 font-body-text shadow-sm">
            No rooms found. Click "Add Room" to get started.
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-surface">Add New Room</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form id="addRoomForm" onSubmit={handleAddRoom} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase font-label-caps">Room Name *</label>
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Lab 101"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase font-label-caps">Location (Optional)</label>
                <input
                  type="text"
                  value={newRoom.location}
                  onChange={(e) => setNewRoom({...newRoom, location: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. First Floor, North Wing"
                />
              </div>
              
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
