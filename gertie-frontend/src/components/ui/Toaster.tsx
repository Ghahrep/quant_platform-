// src/components/ui/Toaster.tsx
import React from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useUIStore, Toast } from '../../store/uiStore';

const ToastIcon: React.FC<{ type: Toast['type'] }> = ({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'info':
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const removeToast = useUIStore((state) => state.removeToast);

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-white border-green-200 text-gray-900 shadow-lg';
      case 'error':
        return 'bg-white border-red-200 text-gray-900 shadow-lg';
      case 'warning':
        return 'bg-white border-yellow-200 text-gray-900 shadow-lg';
      case 'info':
      default:
        return 'bg-white border-blue-200 text-gray-900 shadow-lg';
    }
  };

  return (
    <div className={`flex items-center w-full max-w-sm p-4 rounded-lg border transform transition-all duration-300 ease-in-out ${getToastStyles(toast.type)}`}>
      <div className="flex-shrink-0">
        <ToastIcon type={toast.type} />
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="ml-4 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const Toaster: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};