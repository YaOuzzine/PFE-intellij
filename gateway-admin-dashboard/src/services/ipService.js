// src/services/ipService.js
import apiClient from '../apiClient';

export const fetchIpAddresses = async () => {
  try {
    const response = await apiClient.get('/ip-addresses');
    return response.data;
  } catch (error) {
    console.error('Error fetching IP addresses:', error);
    return [];
  }
};

export const addIpAddress = async (ipData) => {
  const response = await apiClient.post('/ip-addresses', ipData);
  return response.data;
};

export const updateIpAddress = async (id, updatedData) => {
  const response = await apiClient.put(`/ip-addresses/${id}`, updatedData);
  return response.data;
};

export const deleteIpAddress = async (id, routeId) => {
  const response = await apiClient.delete(`/ip-addresses/${id}/gateway/${routeId}`);
  return response.data;
};