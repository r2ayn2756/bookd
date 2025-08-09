'use client';

import { useState, useCallback, useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

export interface NotificationOptions {
  type?: NotificationType;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

/**
 * Hook for managing notifications and toast messages
 * Useful for showing profile update success/error messages
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    title: string, 
    options: NotificationOptions = {}
  ) => {
    const {
      type = 'info',
      message,
      duration = 5000,
      persistent = false
    } = options;

    const id = Math.random().toString(36).substr(2, 9);
    
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration,
      persistent
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove non-persistent notifications
    if (!persistent && duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods for different notification types
  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification(title, { type: 'success', message, duration });
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string, persistent = true) => {
    return addNotification(title, { type: 'error', message, persistent });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification(title, { type: 'warning', message, duration });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification(title, { type: 'info', message, duration });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}

/**
 * Hook for managing async operation states
 * Useful for API calls with loading, success, and error states
 */
export function useAsyncOperation<T = any>() {
  const [state, setState] = useState<{
    loading: boolean;
    data: T | null;
    error: string | null;
    success: boolean;
  }>({
    loading: false,
    data: null,
    error: null,
    success: false
  });

  const execute = useCallback(async (
    operation: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    try {
      setState({
        loading: true,
        data: null,
        error: null,
        success: false
      });

      const result = await operation();

      setState({
        loading: false,
        data: result,
        error: null,
        success: true
      });

      if (onSuccess) {
        onSuccess(result);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      setState({
        loading: false,
        data: null,
        error: errorMessage,
        success: false
      });

      if (onError && error instanceof Error) {
        onError(error);
      }

      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      data: null,
      error: null,
      success: false
    });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

/**
 * Hook for debouncing values (useful for search inputs, form validation)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for managing form field focus states
 * Useful for showing validation errors only after user interaction
 */
export function useFieldFocus() {
  const [focusedFields, setFocusedFields] = useState<Set<string>>(new Set());
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const setFieldFocus = useCallback((fieldName: string, focused: boolean) => {
    setFocusedFields(prev => {
      const newSet = new Set(prev);
      if (focused) {
        newSet.add(fieldName);
      } else {
        newSet.delete(fieldName);
        // Mark as touched when losing focus
        setTouchedFields(prevTouched => new Set([...prevTouched, fieldName]));
      }
      return newSet;
    });
  }, []);

  const isFieldFocused = useCallback((fieldName: string) => {
    return focusedFields.has(fieldName);
  }, [focusedFields]);

  const isFieldTouched = useCallback((fieldName: string) => {
    return touchedFields.has(fieldName);
  }, [touchedFields]);

  const shouldShowError = useCallback((fieldName: string) => {
    return isFieldTouched(fieldName) && !isFieldFocused(fieldName);
  }, [isFieldTouched, isFieldFocused]);

  const resetField = useCallback((fieldName: string) => {
    setFocusedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
    setTouchedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
  }, []);

  const resetAllFields = useCallback(() => {
    setFocusedFields(new Set());
    setTouchedFields(new Set());
  }, []);

  return {
    setFieldFocus,
    isFieldFocused,
    isFieldTouched,
    shouldShowError,
    resetField,
    resetAllFields
  };
}