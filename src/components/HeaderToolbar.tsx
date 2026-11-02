import React from 'react';
import './HeaderToolbar.css';

export interface HeaderToolbarProps {
  testId?: string;
  className?: string;
  sticky?: boolean;
  variant?: 'standard' | 'vibrant';
  elevated?: boolean;
  children: React.ReactNode;
}

export interface ToolbarDividerProps {
  className?: string;
  testId?: string;
}

/**
 * ToolbarDivider - Material 3 Expressive vertical separator for floating toolbars.
 * Used to cleanly partition status/info components from action controls.
 */
export const ToolbarDivider: React.FC<ToolbarDividerProps> = ({
  className = '',
  testId = 'toolbar-divider',
}) => (
  <div
    data-testid={testId}
    className={`hc-toolbar-divider ${className}`.trim()}
    role="separator"
    aria-orientation="vertical"
  />
);

/**
 * HeaderToolbar - Shared M3 Expressive Floating/Sticky Toolbar adhering to Beer CSS standards.
 * Used at the top of pages (InventoryPage, BookingsPage) for consistent action and filter toolbars.
 */
export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  testId,
  className = '',
  sticky = true,
  variant = 'vibrant',
  elevated = true,
  children,
}) => {
  const containerClass =
    variant === 'standard' ? 'surface-container' : 'secondary-container';
  const elevationClass = elevated ? 'medium-elevate' : '';

  const content = (
    <nav
      data-testid={testId}
      className={`toolbar scroll no-wrap no-margin ${containerClass} ${elevationClass} hc-header-toolbar ${className}`.trim()}
    >
      {children}
    </nav>
  );

  if (sticky) {
    return <div className="hc-header-toolbar-sticky-wrapper">{content}</div>;
  }

  return content;
};
