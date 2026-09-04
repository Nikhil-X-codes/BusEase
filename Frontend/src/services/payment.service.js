
import axios from './apiClient';

const API_BASE = import.meta.env.VITE_BASE_URL;

export const createPayment = (data) =>
  axios.post(`${API_BASE}/payments/create`, data,{
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });

export const getPayments = () =>
  axios.get(`${API_BASE}/payments/all`, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });

export const getPaymentById = (id) =>
  axios.get(`${API_BASE}/payments/${id}`, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });


export const updatePayment = (id, data) =>
  axios.put(`${API_BASE}/payments/update/${id}`, data,{
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });

export const downloadBackendTicketPdf = async (id, bookingId) => {
  const response = await axios.get(`${API_BASE}/payments/${id}/ticket.pdf`, {
    responseType: 'blob',
    withCredentials: true,
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `BusEase-Ticket-${bookingId || id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};