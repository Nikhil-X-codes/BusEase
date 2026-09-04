import axios from "./apiClient";

const API_BASE = import.meta.env.VITE_BASE_URL;
const options = { withCredentials: true };

export const getDashboardSummary = () => axios.get(`${API_BASE}/admin/dashboard/summary`, options);
export const getRecentBookings = () => axios.get(`${API_BASE}/admin/bookings/recent`, options);
export const getAdminBuses = (params) => axios.get(`${API_BASE}/admin/buses`, { ...options, params });
export const createAdminBus = (data) => axios.post(`${API_BASE}/admin/buses`, data, options);
export const updateAdminBus = (id, data) => axios.put(`${API_BASE}/admin/buses/${id}`, data, options);
export const updateBusStatus = (id, isActive) => axios.patch(`${API_BASE}/admin/buses/${id}/status`, { isActive }, options);
export const getAdminRoutes = (params) => axios.get(`${API_BASE}/admin/routes`, { ...options, params });
export const createAdminRoute = (data) => axios.post(`${API_BASE}/admin/routes`, data, options);
export const updateAdminRoute = (id, data) => axios.put(`${API_BASE}/admin/routes/${id}`, data, options);
export const updateRouteStatus = (id, isActive) => axios.patch(`${API_BASE}/admin/routes/${id}/status`, { isActive }, options);
export const deleteAdminRoute = (id) => axios.delete(`${API_BASE}/admin/routes/${id}`, options);
