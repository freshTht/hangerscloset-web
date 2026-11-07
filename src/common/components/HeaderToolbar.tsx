import React from 'react';
import './HeaderToolbar.css';

export type HeaderToolbarVariant =
  | 'blur'
  | 'small-blur'
  | 'large-blur'
  | 'vibrant'
  | 'standard';

export type HeaderToolbarElevation = 'none' | 'small' | 'medium' | 'large';

export interface HeaderToolbarProps {
  testId?: string;
  className?: string;
  sticky?: boolean;
  variant?: HeaderToolbarVariant;
  elevated?: boolean;
  elevation?: HeaderToolbarElevation;
  outlined?: boolean;
  children: React.ReactNode;
}

export interface ToolbarDividerProps {
  className?: string;
  testId?: string;
}

export interface HeaderToolbarStickyWrapperProps {
  className?: string;
  testId?: string;
  children: React.ReactNode;
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
 * HeaderToolbarStickyWrapper - Position-sticky container for top header toolbars.
 * Standardizes sticky behavior across pages (BookingsPage, InventoryPage) with safe-area support.
 */
export const HeaderToolbarStickyWrapper: React.FC<HeaderToolbarStickyWrapperProps> = ({
  className = '',
  testId,
  children,
}) => (
  <div
    data-testid={testId}
    className={`hc-header-toolbar-sticky-wrapper ${className}`.trim()}
  >
    {children}
  </div>
);

/**
 * HeaderToolbar - Shared M3 Expressive Floating/Sticky Toolbar adhering to Beer CSS standards.
 * Defaults to blurred background (`blur`) with clean outline (`border`) rather than elevation.
 * Used at the top of pages (InventoryPage, BookingsPage) for consistent action and filter toolbars.
 */
export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  testId,
  className = '',
  sticky = true,
  variant = 'blur',
  elevated = false,
  elevation = 'none',
  outlined = true,
  children,
}) => {
  const getVariantClass = (v: HeaderToolbarVariant): string => {
    switch (v) {
      case 'blur':
        return 'blur';
      case 'small-blur':
        return 'small-blur blur';
      case 'large-blur':
        return 'large-blur blur';
      case 'vibrant':
        return 'secondary-container';
      case 'standard':
        return 'surface-container';
      default:
        return 'blur';
    }
  };

  const getElevationClass = (): string => {
    if (!elevated && elevation === 'none') return '';
    let effElevation = elevation;
    if (effElevation === 'none' && elevated) {
      effElevation = 'small';
    }
    switch (effElevation) {
      case 'small':
        return 'small-elevate';
      case 'medium':
        return 'medium-elevate';
      case 'large':
        return 'large-elevate';
      default:
        return '';
    }
  };

  const containerClass = getVariantClass(variant);
  const elevationClass = getElevationClass();
  const outlineClass = outlined ? 'border is-outlined' : '';

  const content = (
    <nav
      data-testid={testId}
      className={`toolbar scroll no-wrap no-margin ${containerClass} ${outlineClass} ${elevationClass} hc-header-toolbar ${className}`.trim()}
    >
      {children}
    </nav>
  );

  if (sticky) {
    return <HeaderToolbarStickyWrapper>{content}</HeaderToolbarStickyWrapper>;
  }

  return content;
};
