
import axios from 'axios';

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