import React from 'react';
import { Stack } from './Stack';
import './EmptyState.css';

export interface EmptyStateProps {
  icon: string;
  title: string;
  description?: React.ReactNode;
  actionText?: string;
  actionIcon?: string;
  onAction?: () => void;
  actionTitle?: string;
  secondaryActionText?: string;
  secondaryActionIcon?: string;
  onSecondaryAction?: () => void;
  minHeight?: string;
  testId?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  actionIcon,
  onAction,
  actionTitle,
  secondaryActionText,
  secondaryActionIcon,
  onSecondaryAction,
  minHeight = '50dvh',
  testId,
}) => {
  return (
    <div
      data-testid={testId}
      className="padding hc-empty-state-wrapper"
      style={{ minHeight }}
    >
      <Stack
        orientation="column"
        align="center"
        justify="center"
        gap="medium"
        className="hc-empty-state-content"
      >
        <div className="surface-container-high circle center-align middle-align hc-empty-state-icon">
          <i className="extra secondary-text">{icon}</i>
        </div>

        <Stack
          orientation="column"
          align="center"
          gap="tiny"
          className="max"
        >
          <h5 className="bold no-margin on-surface-text">{title}</h5>
          {description && (
            <p className="secondary-text no-margin hc-empty-state-desc">
              {description}
            </p>
          )}
        </Stack>

        {(onAction || onSecondaryAction) && (
          <div className="row center-align wrap hc-empty-state-actions">
            {onAction && actionText && (
              <button
                type="button"
                className="primary round hc-empty-state-btn"
                onClick={onAction}
                title={actionTitle || actionText}
              >
                {actionIcon && <i>{actionIcon}</i>}
                <span>{actionText}</span>
              </button>
            )}
            {onSecondaryAction && secondaryActionText && (
              <button
                type="button"
                className="border round hc-empty-state-btn secondary"
                onClick={onSecondaryAction}
              >
                {actionIcon && <i>{secondaryActionIcon}</i>}
                <span>{secondaryActionText}</span>
              </button>
            )}
          </div>
        )}
      </Stack>
    </div>
  );
};
