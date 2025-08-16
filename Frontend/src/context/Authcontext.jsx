import { createContext, useContext, useState } from 'react';

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  signIn: () => {}
});

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null
  });

  const login = (userData) => {
    setAuthState({
      isAuthenticated: true,
      user: userData
    });
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null
    });
  };

  const signIn = (userData) => {
    setAuthState({
      isAuthenticated: true,
      user: userData
    });
  };

  return (
    <AuthContext.Provider 
      value={{
        ...authState,
        login,
        logout,
        signIn
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};