
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BASE_URL;

export const createBus = (data) =>                                   // admin
  axios.post(`${API_BASE}/book/create`, data, {
         headers:{
        'Content-Type': 'application/json'
      },
        withCredentials: true
  });


export const getBuses = () =>                                          
  axios.get(`${API_BASE}/book/get`,{
         headers:{
        'Content-Type': 'application/json'
      },
        withCredentials: true
  });

export const getBusById = (id) =>
  axios.get(`${API_BASE}/book/${id}` ,{
         headers:{
        'Content-Type': 'application/json'
      },
        withCredentials: true
  });

export const updateBus = (id, data) =>                                           // admin
  axios.put(`${API_BASE}/book/update/${id}`, data,{
         headers:{
        'Content-Type': 'application/json'
      },
        withCredentials: true
  });

export const deleteBus = (id) =>                                                    // admin
  axios.delete(`${API_BASE}/book/delete/${id}`,{
         headers:{
        'Content-Type': 'application/json'
      },
        withCredentials: true
  });

export const updateSeatAvailability = (id, seatNumber, data ) =>                   
  axios.put(`${API_BASE}/book/${id}/seats/${seatNumber}`, data, {
         headers:{
        'Content-Type': 'application/json'
      },
        withCredentials: true
  });
