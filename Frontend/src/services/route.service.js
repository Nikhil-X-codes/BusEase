import axios from 'axios';

const API_BASE = import.meta.env.VITE_BASE_URL;

export const createRoute = (data) =>
  axios.post(`${API_BASE}/routes/create`, data,{
             headers:{
        'Content-Type': 'application/json'
      },
        withCredentials: true
  });

  export const getRoutes = () =>
  axios.get(`${API_BASE}/routes/all`, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  export const updateRoute = (id, data) =>
  axios.put(`${API_BASE}/routes/update/${id}`, data, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  export const deleteRoute = (id) =>
  axios.delete(`${API_BASE}/routes/delete/${id}`,{
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

 export const searchRoute = (params) =>
  axios.get(`${API_BASE}/routes/search`, {
    params, 
    withCredentials: true, 
    headers: { "Content-Type": "application/json" },
  });




