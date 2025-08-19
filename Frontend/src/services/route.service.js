import axios from "axios";

const API_BASE = import.meta.env.VITE_BASE_URL;

// ✅ Create a new route (admin only)
export const createRoute = (data) =>
  axios.post(`${API_BASE}/routes/create`, data, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

// ✅ Get all routes (admin only, protected)
export const getRoutes = () =>
  axios.get(`${API_BASE}/routes/all`, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

// ✅ Update a route by ID (admin only)
export const updateRoute = (id, data) =>
  axios.put(`${API_BASE}/routes/update/${id}`, data, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

// ✅ Delete a route by ID (admin only)
export const deleteRoute = (id) =>
  axios.delete(`${API_BASE}/routes/delete/${id}`, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

// ✅ Search routes (protected)
export const searchRoute = (params) =>
  axios.get(`${API_BASE}/routes/search`, {
    params, // e.g. { from: "Mumbai", to: "Delhi" }
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });
