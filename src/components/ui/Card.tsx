import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-gray-800 border border-gray-700 rounded-lg p-6', className)}>
      {children}
    </div>
  );
}