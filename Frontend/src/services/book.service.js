import axios from "./apiClient";

const API_BASE = import.meta.env.VITE_BASE_URL;

// ✅ Create a new bus (admin only)
export const createBus = (data) =>
  axios.post(`${API_BASE}/book/create`, data, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

// ✅ Get all buses
export const getBuses = () =>
  axios.get(`${API_BASE}/book/get`, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

// ✅ Get a single bus by ID
export const getBusById = (id) =>
  axios.get(`${API_BASE}/book/${id}`, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

export const getTripInventory = (busId, date) =>
  axios.get(`${API_BASE}/book/${busId}/inventory`, {
    params: { date },
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

// Hold seats temporarily during selection
export const holdTripSeats = (busId, date, seatNumbers) =>
  axios.post(
    `${API_BASE}/book/${busId}/inventory/hold`,
    { date, seatNumbers },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );

// Release seat hold
export const releaseTripSeats = (busId, date, seatNumbers) =>
  axios.post(
    `${API_BASE}/book/${busId}/inventory/release`,
    { date, seatNumbers },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );

// ✅ Update a bus (admin only)
export const updateBus = (id, data) =>
  axios.put(`${API_BASE}/book/update/${id}`, data, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

// ✅ Delete a bus (admin only)
export const deleteBus = (id) =>
  axios.delete(`${API_BASE}/book/delete/${id}`, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

// ✅ Update seat availability (admin only)
export const updateSeatAvailability = (id, seatNumber, data) =>
  axios.put(`${API_BASE}/book/${id}/seats/${seatNumber}`, data, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

// ✅ Get buses by location (new route)
export const getBusesByLocation = (params) =>
  axios.get(`${API_BASE}/book/get/loc`, {
    params, // e.g. { from: "Mumbai", to: "Delhi" }
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });
