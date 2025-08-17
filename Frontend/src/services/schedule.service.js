import axios from 'axios';

const API_BASE = import.meta.env.VITE_BASE_URL;

export const createSchedule = (data) =>
  axios.post(`${API_BASE}/schedules/create`, data,{
             headers:{
        'Content-Type': 'application/json'
      },
        withCredentials: true
  });

export const getSchedules = () =>
  axios.get(`${API_BASE}/schedules/all`, {
         headers:{
        'Content-Type': 'application/json'
      },
        withCredentials: true
  });

export const getScheduleById = (id) =>
  axios.get(`${API_BASE}/schedules/${id}`, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });

export const updateSchedule = (id, data) =>
  axios.put(`${API_BASE}/schedules/update/${id}`, data,{
             headers:{
        'Content-Type': 'application/json'
      },
        withCredentials: true
  });

export const deleteSchedule = (id) =>
  axios.delete(`${API_BASE}/schedules/delete/${id}`,{
             headers:{
        'Content-Type': 'application/json'
      },
        withCredentials: true
  });