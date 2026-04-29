import api from './axios';

export const getRooms = async () => {
  const response = await api.get('/rooms');
  return response.data;
};

export const getRoom = async (id) => {
  const response = await api.get(`/rooms/${id}`);
  return response.data;
};

export const createRoom = async (roomData) => {
  const response = await api.post('/rooms', roomData);
  return response.data;
};
