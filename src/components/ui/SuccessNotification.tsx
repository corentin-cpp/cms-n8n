import { CheckCircle, X } from 'lucide-react';

interface SuccessNotificationProps {
  message: string;
  onClose: () => void;
}

export function SuccessNotification({ message, onClose }: SuccessNotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-green-900/90 border border-green-700 rounded-lg p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-green-100">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
