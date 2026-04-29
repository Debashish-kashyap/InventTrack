import api from './axios';

export const getLogs = async () => {
  const response = await api.get('/logs');
  return response.data;
};

export const deleteLog = async (id) => {
  const response = await api.delete(`/logs/${id}`);
  return response.data;
};

export const clearAllLogs = async () => {
  const response = await api.delete('/logs');
  return response.data;
};
