import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  const sizeMap: Record<string, string> = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={`border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin ${
        sizeMap[size]
      }`}
    />
  );
}
