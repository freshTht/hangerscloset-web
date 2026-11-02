import React from 'react';
import './StatusBadge.css';

export interface StatusBadgeProps {
  variant?: 'available' | 'reserved' | 'laundry';
  size?: 'normal' | 'small';
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  size = 'normal',
  className = '',
  children,
  'data-testid': testId,
}) => {
  const sizeClass = size === 'small' ? 'small' : '';
  const variantClass = variant ? `hc-status-badge-${variant}` : '';

  return (
    <span
      className={`hc-status-badge ${sizeClass} ${variantClass} ${className}`.trim()}
      data-testid={testId}
    >
      {children}
    </span>
  );
};
