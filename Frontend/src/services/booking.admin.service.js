import axios from "./apiClient";

const API_BASE = import.meta.env.VITE_BASE_URL;
const options = { withCredentials: true };

export const getAdminBookings = (params) => axios.get(`${API_BASE}/admin/bookings`, { ...options, params });
export const cancelAdminBooking = (id, reason) => axios.patch(`${API_BASE}/admin/bookings/${id}/cancel`, { reason }, options);
export const refundAdminBooking = (id, amount) => axios.patch(`${API_BASE}/admin/bookings/${id}/refund`, { amount }, options);

export const downloadAdminBookingPdf = async (id, bookingId) => {
  const response = await axios.get(`${API_BASE}/admin/bookings/${id}/pdf`, {
    ...options,
    responseType: "blob",
  });
  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `BusEase-Ticket-${bookingId || id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
