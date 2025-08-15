import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (email, password) => {
    // Implement API call here
    // Example:
    // const res = await axios.post(`/users/login`, { email, password }, { withCredentials: true });
    // const userData = res.data;
    // setUser(userData);
    // localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const signIn = async (form) => {
    // Implement API call here
    // Example:
    // const formData = new FormData();
    // formData.append('username', form.username);
    // formData.append('email', form.email);
    // formData.append('password', form.password);
    // const res = await axios.post(`/users/register`, formData);
    // if (res.data.success) await login(form.email, form.password);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
