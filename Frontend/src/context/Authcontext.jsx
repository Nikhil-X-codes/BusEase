import { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile, refreshToken } from '../services/auth.service';

const AuthContext = createContext({
  isAuthenticated: false,
  isInitializing: true,
  error: null,
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
  const [isInitializing, setIsInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
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

          try {
            const profileResponse = await getUserProfile();
            const serverUser = profileResponse?.data?.data;
            if (serverUser) login(serverUser);
          } catch (profileError) {
            if (profileError?.response?.status === 401) {
              try {
                await refreshToken();
                const profileResponse = await getUserProfile();
                const serverUser = profileResponse?.data?.data;
                if (serverUser) login(serverUser);
              } catch {
                localStorage.removeItem('user');
                localStorage.removeItem('authState');
                setAuthState({ isAuthenticated: false, user: null });
              }
            }
          }
        }
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('authState');
        setAuthState({ isAuthenticated: false, user: null });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!authState.isAuthenticated) return undefined;
    const refreshInterval = window.setInterval(async () => {
      try {
        await refreshToken();
        const response = await getUserProfile();
        if (response?.data?.data) login(response.data.data);
      } catch {
        window.dispatchEvent(new Event('auth:expired'));
      }
    }, 45 * 60 * 1000);
    return () => window.clearInterval(refreshInterval);
  }, [authState.isAuthenticated]);

  useEffect(() => {
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('busease-auth') : null;
    const clearSession = () => {
      setAuthState({ isAuthenticated: false, user: null });
      setAuthError('Your session has expired. Please sign in again.');
      localStorage.removeItem('user');
      localStorage.removeItem('authState');
    };
    const handleStorage = (event) => {
      if (event.key === 'authState' && !event.newValue) clearSession();
    };
    const handleExpired = () => clearSession();
    channel?.addEventListener('message', handleExpired);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth:expired', handleExpired);
    return () => {
      channel?.removeEventListener('message', handleExpired);
      channel?.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth:expired', handleExpired);
    };
  }, []);

  const login = (userData) => {
    const newAuthState = {
      isAuthenticated: true,
      user: userData
    };
    
    setAuthState(newAuthState);
    
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('authState', JSON.stringify(newAuthState));
    setAuthError(null);
  };

  const logout = () => {
    const newAuthState = {
      isAuthenticated: false,
      user: null
    };
    
    setAuthState(newAuthState);

    localStorage.removeItem('user');
    localStorage.removeItem('authState');
    setAuthError(null);
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('busease-auth');
      channel.postMessage({ type: 'logout' });
      channel.close();
    }
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
        isInitializing,
        error: authError,
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