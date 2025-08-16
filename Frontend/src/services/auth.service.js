import axios from 'axios';

const API_BASE = import.meta.env.VITE_BASE_URL;

export const register = (FormData) =>
    axios.post(`${API_BASE}/users/register`,FormData,{
      headers:{
        'Content-Type': 'application/json'
      },
        withCredentials: true
    })

export const login = (data) =>
    axios.post(`${API_BASE}/users/login`, data, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
    });

export const logout = () =>
    axios.get(`${API_BASE}/users/logout`, {
        withCredentials: true
    });

export const getCurrentUser = () =>
    axios.get(`${API_BASE}/users/current`, {
        withCredentials: true
    });

export const changePassword = (passwordData) =>
    axios.post(`${API_BASE}/users/changepassword`, passwordData, {
        withCredentials: true
    });

export const getUserProfile = (username) =>
    axios.get(`${API_BASE}/users/${username}/profile`, {
        withCredentials: true
    });

export const updateProfile = (username, profileData) =>
    axios.put(`${API_BASE}/users/${username}/updateprofile`, profileData, {
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true
    });

export const refreshToken = () =>
    axios.post(`${API_BASE}/users/refresh-token`, {}, {
        withCredentials: true
    });

export const sendPasswordResetOTP = (email) =>
    axios.post(
        `${API_BASE}/users/send-password-reset-otp`,
        { email },
        {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        }
    );

export const resetPasswordWithOTP = (resetData) =>
    axios.post(
        `${API_BASE}/users/reset-password-with-otp`,
        resetData,
        {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        }
    );

export const getBookingHistory = () =>
    axios.get(`${API_BASE}/users/booking-history`, {
        withCredentials: true
    });


