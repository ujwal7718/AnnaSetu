import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.token,
        user: action.payload.user,
        loading: false
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        user: null,
        loading: false
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'AUTH_ERROR':
      localStorage.removeItem('token');
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        user: null,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: true,
    user: (() => {
      try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        return null;
      }
    })(),
    error: null
  });

  // Set auth token header
  const setAuthToken = token => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Load user
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token) {
      setAuthToken(token);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { token, user: res.data }
        });
        // Update stored user with fresh data
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (error) {
        console.error('Error loading user from API:', error);
        // If API fails but we have stored user data, use it temporarily
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { token, user: parsedUser }
            });
          } catch (parseError) {
            console.error('Error parsing stored user:', parseError);
            dispatch({ type: 'AUTH_ERROR', payload: 'Session expired' });
          }
        } else {
          dispatch({ type: 'AUTH_ERROR', payload: error.response?.data?.message });
        }
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Login user
  const login = async (formData) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data
      });
      setAuthToken(res.data.token);
      // Store user in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return res.data;
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error.response?.data?.message });
      throw error;
    }
  };

  // Register user
  // The server no longer issues a JWT on registration.
  // Instead it returns { requiresVerification: true } and the user must
  // verify their email before they can log in.
  const register = async (formData) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, formData);
      // Do NOT dispatch LOGIN_SUCCESS — user is not authenticated yet
      return res.data; // { message, requiresVerification }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error.response?.data?.message });
      throw error;
    }
  };

  // Logout
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    setAuthToken(null);
    // Remove user from localStorage
    localStorage.removeItem('user');
  };

  // Update user state
  const updateUser = (updatedUser) => {
    dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    // Update user in localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        loadUser,
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
