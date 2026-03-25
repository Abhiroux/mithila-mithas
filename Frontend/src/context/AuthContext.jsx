import { createContext, useContext, useState, useEffect } from 'react';
import useCartStore from '../store/useCartStore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Optimistically set user from local storage while verifying session with backend
    const storedUser = localStorage.getItem('mithilaUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const verifySession = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/profile', {
          credentials: 'include' // Send HTTP-only cookie
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          localStorage.setItem('mithilaUser', JSON.stringify(data));
          
          // Fetch the cart reliably from the backend for the validated session
          useCartStore.getState().fetchCart();
        } else {
          setUser(null);
          localStorage.removeItem('mithilaUser');
        }
      } catch (error) {
        console.error('Session verification error:', error);
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      setUser(data);
      localStorage.setItem('mithilaUser', JSON.stringify(data));
      // token relies on HTTPOnly cookie securely processed by browser automatically
      
      // Sync the cart upon login
      await useCartStore.getState().syncWithBackend();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      // Do not log user in immediately, just return success so UI can prompt for OTP
      return { success: true, email: data.email };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP verification failed');
      
      setUser(data);
      localStorage.setItem('mithilaUser', JSON.stringify(data));
      // token is securely in cookie
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const refreshUser = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem('mithilaUser', JSON.stringify(data));
        return data;
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
    return null;
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' 
      });
    } catch (error) {
      console.error('Logout error', error);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('mithilaUser');
    useCartStore.getState().clearCart();
  };

  const updateProfile = async (updates) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      
      setUser(data);
      localStorage.setItem('mithilaUser', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verifyOtp, logout, updateProfile, refreshUser, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
