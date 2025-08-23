import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  signIn: () => {},
  updateUser: () => {}
});

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null
  });

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedAuthState = localStorage.getItem('authState');
        
        if (savedUser && savedAuthState) {
          const userData = JSON.parse(savedUser);
          const authData = JSON.parse(savedAuthState);
          
          setAuthState({
            isAuthenticated: authData.isAuthenticated || false,
            user: userData
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('authState');
      }
    };

    initializeAuth();
  }, []);

  const login = (userData) => {
    const newAuthState = {
      isAuthenticated: true,
      user: userData
    };
    
    setAuthState(newAuthState);
    
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('authState', JSON.stringify(newAuthState));
  };

  const logout = () => {
    const newAuthState = {
      isAuthenticated: false,
      user: null
    };
    
    setAuthState(newAuthState);

    localStorage.removeItem('user');
    localStorage.removeItem('authState');
  };

  const signIn = (userData) => {
    const newAuthState = {
      isAuthenticated: true,
      user: userData
    };
    
    setAuthState(newAuthState);
    
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('authState', JSON.stringify(newAuthState));
  };

  const updateUser = (userData) => {
    const newAuthState = {
      ...authState,
      user: userData
    };
    
    setAuthState(newAuthState);
    
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('authState', JSON.stringify(newAuthState));
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        signIn,
        updateUser
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