import React, { useState, useId } from 'react';
import './Collapsible.css';

export interface CollapsibleProps {
  /** Controlled open state */
  open?: boolean;
  /** Initial open state when uncontrolled (defaults to true) */
  defaultOpen?: boolean;
  /** Callback fired when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Header title text or element */
  title: React.ReactNode;
  /** Optional element on the leading side of title (e.g. status icon or badge) */
  leadingSlot?: React.ReactNode;
  /** Optional badge next to title (e.g. count chip) */
  badgeSlot?: React.ReactNode;
  /** Optional action element in header */
  headerActionSlot?: React.ReactNode;
  /** Collapsible body content */
  children: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Visual variant: 'plain' | 'card' | 'bordered' */
  variant?: 'plain' | 'card' | 'bordered';
  /** Extra container class names */
  className?: string;
  /** Extra header class names */
  headerClassName?: string;
  /** Extra content container class names */
  contentClassName?: string;
  /** Test ID */
  testId?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  open: controlledOpen,
  defaultOpen = true,
  onOpenChange,
  title,
  leadingSlot,
  badgeSlot,
  headerActionSlot,
  children,
  disabled = false,
  variant = 'plain',
  className = '',
  headerClassName = '',
  contentClassName = '',
  testId,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const contentId = useId();
  const triggerId = useId();

  const handleToggle = () => {
    if (disabled) return;
    const next = !isOpen;
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <section
      className={`hc-collapsible hc-collapsible-${variant} ${isOpen ? 'is-open' : 'is-closed'} ${className}`.trim()}
      data-testid={testId}
    >
      <div className={`hc-collapsible-header-wrapper ${headerClassName}`.trim()}>
        <button
          id={triggerId}
          type="button"
          className="hc-collapsible-trigger ripple"
          aria-expanded={isOpen}
          aria-controls={contentId}
          disabled={disabled}
          onClick={handleToggle}
        >
          <div className="hc-collapsible-trigger-left">
            {leadingSlot && (
              <span className="hc-collapsible-leading">{leadingSlot}</span>
            )}
            {typeof title === 'string' ? (
              <h6 className="small bold no-margin hc-collapsible-title">{title}</h6>
            ) : (
              <span className="hc-collapsible-title bold">{title}</span>
            )}
          </div>

          <div className="hc-collapsible-trigger-right" data-testid="collapsible-chevron-btn">
            {badgeSlot && (
              <span className="hc-collapsible-badge">{badgeSlot}</span>
            )}
            <i
              className={`hc-collapsible-chevron ${isOpen ? 'is-expanded' : ''}`}
              aria-hidden="true"
            >
              expand_more
            </i>
          </div>
        </button>

        {headerActionSlot && (
          <div className="hc-collapsible-extra-action">
            {headerActionSlot}
          </div>
        )}
      </div>

      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        className={`hc-collapsible-content ${isOpen ? 'is-open' : ''} ${contentClassName}`.trim()}
      >
        <div className="hc-collapsible-inner">
          {children}
        </div>
      </div>
    </section>
  );
};
