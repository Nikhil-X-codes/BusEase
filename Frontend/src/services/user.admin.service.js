import axios from "./apiClient";

const API_BASE = import.meta.env.VITE_BASE_URL;
const options = { withCredentials: true };

export const getAdminUsers = (params) => axios.get(`${API_BASE}/admin/customers`, { ...options, params });
export const deactivateAdminUser = (id) => axios.patch(`${API_BASE}/admin/customers/${id}/deactivate`, {}, options);
