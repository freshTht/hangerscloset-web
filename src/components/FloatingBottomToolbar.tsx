import React from 'react';
import { ToolbarDivider } from './HeaderToolbar';
import './FloatingBottomToolbar.css';

export interface FloatingBottomToolbarProps {
  testId?: string;
  className?: string;
  /** Status or count display element (e.g., "43 ชุด") */
  status?: React.ReactNode;
  /** Action controls to place inside the floating toolbar (e.g. search, view toggles) */
  actions: React.ReactNode;
  /** Optional custom FAB trigger node */
  fab?: React.ReactNode;
  /** Quick FAB click handler when using default circular add FAB */
  onFabClick?: () => void;
  fabAriaLabel?: string;
  fabTitle?: string;
}

/**
 * FloatingBottomToolbar - Material 3 Expressive Floating Bottom Action Toolbar paired with FAB.
 * Adheres to M3 Expressive floating toolbar specifications:
 * - Pill shape container with Level 2 elevation and backdrop blur
 * - Vertical divider separating status/info from action controls
 * - Paired 8dp gap between floating action toolbar and circular FAB
 * - Unified 52px height alignment and >= 48px touch targets
 * - Responsive placement: centered on small screens, right-aligned on medium/large screens
 */
export const FloatingBottomToolbar: React.FC<FloatingBottomToolbarProps> = ({
  testId = 'floating-bottom-toolbar',
  className = '',
  status,
  actions,
  fab,
  onFabClick,
  fabAriaLabel = 'สร้างการจองใหม่',
  fabTitle,
}) => {
  return (
    <div
      className={`hc-floating-bottom-bar-container ${className}`.trim()}
      data-testid={testId}
    >
      <nav
        className="toolbar secondary-container medium-elevate hc-floating-bottom-toolbar"
        aria-label="การดำเนินการด่วน"
      >
        {status && (
          <>
            <div className="hc-floating-bottom-toolbar-status">{status}</div>
            <ToolbarDivider />
          </>
        )}
        <div className="hc-floating-bottom-toolbar-actions">{actions}</div>
      </nav>

      {fab ? (
        fab
      ) : onFabClick ? (
        <button
          type="button"
          className="circle primary medium-elevate extra no-margin hc-floating-bottom-fab"
          onClick={onFabClick}
          aria-label={fabAriaLabel}
          title={fabTitle ?? fabAriaLabel}
        >
          <i>add</i>
        </button>
      ) : null}
    </div>
  );
};
