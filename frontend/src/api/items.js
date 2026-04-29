import api from './axios';

export const getItems = async () => {
  const response = await api.get('/items');
  return response.data;
};

export const getItem = async (id) => {
  const response = await api.get(`/items/${id}`);
  return response.data;
};

export const createItem = async (itemData) => {
  const response = await api.post('/items', itemData);
  return response.data;
};

export const updateItem = async (id, itemData) => {
  const response = await api.put(`/items/${id}`, itemData);
  return response.data;
};

export const deleteItem = async (id) => {
  const response = await api.delete(`/items/${id}`);
  return response.data;
};

export const transferItem = async (id, roomId) => {
  const response = await api.put(`/items/${id}/transfer`, { room_id: roomId });
  return response.data;
};
