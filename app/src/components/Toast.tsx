import { useToastStore } from '../store/useToastStore';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        let Icon = Info;
        let bgColor = 'bg-blue-50 dark:bg-blue-900/30';
        let borderColor = 'border-blue-200 dark:border-blue-800';
        let textColor = 'text-blue-800 dark:text-blue-300';
        let iconColor = 'text-blue-500 dark:text-blue-400';

        if (toast.type === 'success') {
          Icon = CheckCircle;
          bgColor = 'bg-green-50 dark:bg-green-900/30';
          borderColor = 'border-green-200 dark:border-green-800';
          textColor = 'text-green-800 dark:text-green-300';
          iconColor = 'text-green-500 dark:text-green-400';
        } else if (toast.type === 'error') {
          Icon = XCircle;
          bgColor = 'bg-red-50 dark:bg-red-900/30';
          borderColor = 'border-red-200 dark:border-red-800';
          textColor = 'text-red-800 dark:text-red-300';
          iconColor = 'text-red-500 dark:text-red-400';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          bgColor = 'bg-amber-50 dark:bg-amber-900/30';
          borderColor = 'border-amber-200 dark:border-amber-800';
          textColor = 'text-amber-800 dark:text-amber-300';
          iconColor = 'text-amber-500 dark:text-amber-400';
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border ${bgColor} ${borderColor} max-w-sm animate-in slide-in-from-right-full fade-in duration-300`}
            role="alert"
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
            <div className={`flex-1 text-sm font-medium ${textColor}`}>
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className={`p-1 rounded-md shrink-0 opacity-70 hover:opacity-100 transition-opacity ${textColor}`}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
