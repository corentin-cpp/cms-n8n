import { AlertCircle, X } from 'lucide-react';

interface ErrorNotificationProps {
  error: string;
  onClose: () => void;
}

export function ErrorNotification({ error, onClose }: ErrorNotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-red-900/90 border border-red-700 rounded-lg p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-100">{error}</p>
          </div>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
