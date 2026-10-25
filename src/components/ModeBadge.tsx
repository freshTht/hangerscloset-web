import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface ModeBadgeProps {
  provider?: 'mock' | 'firebase';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ModeBadge displays a subtle 'MOCK' badge when running in mock data mode.
 * In Firebase/production mode, it renders nothing (hidden) to maintain a clean, distraction-free UI.
 */
export const ModeBadge: React.FC<ModeBadgeProps> = ({
  provider: providerProp,
  className = '',
  style,
}) => {
  const { provider: authProvider } = useAuth();
  const provider = providerProp ?? authProvider;

  if (provider !== 'mock') {
    return null;
  }

  return (
    <span
      className={`chip fill error small bold no-margin ${className}`.trim()}
      style={{
        padding: '2px 8px',
        height: 'auto',
        fontSize: '0.75rem',
        borderRadius: '6px',
        letterSpacing: '0.05em',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      MOCK
    </span>
  );
};
