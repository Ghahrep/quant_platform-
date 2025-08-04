// src/store/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface UIState {
  // Toast management
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Theme management
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Connection status
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Toast state
      toasts: [],
      addToast: (message: string, type: Toast['type'] = 'info', duration: number = 5000) => {
        const id = Math.random().toString(36).substring(7);
        const toast: Toast = { id, message, type, duration };
        
        set((state) => ({
          toasts: [...state.toasts, toast]
        }));
        
        // Auto-remove toast after duration
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }
      },
      removeToast: (id: string) => set((state) => ({
        toasts: state.toasts.filter(toast => toast.id !== id)
      })),
      clearToasts: () => set({ toasts: [] }),
      
      // Sidebar state
      sidebarOpen: false,
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      
      // Theme state
      theme: 'system',
      setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),
      
      // Loading state
      isLoading: false,
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      // Connection state
      isConnected: true,
      setConnected: (connected: boolean) => set({ isConnected: connected }),
    }),
    {
      name: 'gertie-ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Convenience hook for toast functionality
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);
  const removeToast = useUIStore((state) => state.removeToast);
  const clearToasts = useUIStore((state) => state.clearToasts);
  
  const showToast = (message: string, type: Toast['type'] = 'info', duration?: number) => {
    addToast(message, type, duration);
  };
  
  return {
    showToast,
    removeToast,
    clearToasts,
  };
};

// Additional convenience hooks
export const useTheme = () => {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  
  return { theme, setTheme };
};

export const useSidebar = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  
  return { sidebarOpen, setSidebarOpen };
};

export const useLoading = () => {
  const isLoading = useUIStore((state) => state.isLoading);
  const setLoading = useUIStore((state) => state.setLoading);
  
  return { isLoading, setLoading };
};

export const useConnection = () => {
  const isConnected = useUIStore((state) => state.isConnected);
  const setConnected = useUIStore((state) => state.setConnected);
  
  return { isConnected, setConnected };
};