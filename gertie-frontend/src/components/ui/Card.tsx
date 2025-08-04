// src/components/ui/Card.tsx
import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  ...props 
}) => {
  return (
    <div 
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  children, 
  className, 
  ...props 
}) => {
  return (
    <div 
      className={cn("px-6 py-4 border-b border-gray-200 dark:border-gray-700", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardContentProps> = ({ 
  children, 
  className, 
  ...props 
}) => {
  return (
    <div 
      className={cn("px-6 py-4", className)}
      {...props}
    >
      {children}
    </div>
  );
};