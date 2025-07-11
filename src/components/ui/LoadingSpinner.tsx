interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div 
      className={`${sizeClasses[size]} border-[#24B2A4] border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Chargement"
    />
  );
}

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Chargement...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center min-h-64 ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
}
