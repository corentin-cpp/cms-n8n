import React from 'react';
import { cn } from '../../lib/utils';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm text-gray-300', className)}>
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps {
  children: React.ReactNode;
}

export function TableHeader({ children }: TableHeaderProps) {
  return <thead className="bg-gray-900 text-xs uppercase text-gray-400">{children}</thead>;
}

interface TableBodyProps {
  children: React.ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody className="divide-y divide-gray-700">{children}</tbody>;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

export function TableRow({ children, className }: TableRowProps) {
  return <tr className={cn('hover:bg-gray-700 transition-colors', className)}>{children}</tr>;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCell({ children, className }: TableCellProps) {
  return <td className={cn('px-6 py-4', className)}>{children}</td>;
}

interface TableHeaderCellProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHeaderCell({ children, className }: TableHeaderCellProps) {
  return <th className={cn('px-6 py-3 text-left', className)}>{children}</th>;
}