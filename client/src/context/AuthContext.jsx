import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  initializeAuth,
  login as loginAction,
  logout as logoutAction,
  register as registerAction,
  updateProfile as updateProfileAction
} from '../store/slices/authSlice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, loading, submitting, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    submitting,
    login: async (email, password) => {
      const result = await dispatch(loginAction({ email, password }));
      if (loginAction.fulfilled.match(result)) {
        toast.success('Welcome back!');
        return result.payload;
      }
      throw new Error(result.payload);
    },
    register: async (payload) => {
      const result = await dispatch(registerAction(payload));
      if (registerAction.fulfilled.match(result)) {
        toast.success('Account created!');
        return result.payload;
      }
      throw new Error(result.payload);
    },
    logout: () => {
      dispatch(logoutAction());
      toast.success('Logged out');
    },
    updateUser: async (payload) => {
      const result = await dispatch(updateProfileAction(payload));
      if (updateProfileAction.fulfilled.match(result)) {
        toast.success('Profile updated');
        return result.payload;
      }
      throw new Error(result.payload);
    }
  }), [dispatch, user, loading, isAuthenticated, submitting]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
