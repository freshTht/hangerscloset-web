import React from 'react';
import './Skeleton.css';

export interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  shape?: 'round' | 'circle' | 'square';
  children?: React.ReactNode;
  'data-testid'?: string;
  'aria-hidden'?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  style,
  shape,
  children,
  'data-testid': testId,
  'aria-hidden': ariaHidden = true,
}) => {
  const shapeClass = shape ? shape : '';
  return (
    <div
      className={`hc-skeleton ${shapeClass} ${className}`.trim()}
      style={style}
      data-testid={testId}
      aria-hidden={ariaHidden}
    >
      {children}
    </div>
  );
};
