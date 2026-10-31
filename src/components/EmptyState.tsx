import React from 'react';
import { Stack } from './Stack';

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
      className="padding"
      style={{
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Stack
        orientation="column"
        align="center"
        justify="center"
        gap="medium"
        style={{
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
          padding: '24px 16px',
        }}
      >
        <div
          className="surface-container-high circle center-align middle-align"
          style={{
            width: '72px',
            height: '72px',
            minWidth: '72px',
            minHeight: '72px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          <i className="extra secondary-text">{icon}</i>
        </div>

        <Stack
          orientation="column"
          align="center"
          gap="tiny"
          style={{ width: '100%' }}
        >
          <h5 className="bold no-margin on-surface-text">{title}</h5>
          {description && (
            <p
              className="secondary-text no-margin"
              style={{
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}
            >
              {description}
            </p>
          )}
        </Stack>

        {(onAction || onSecondaryAction) && (
          <div
            className="row center-align wrap"
            style={{
              gap: '12px',
              marginTop: '8px',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            {onAction && actionText && (
              <button
                type="button"
                className="primary round"
                onClick={onAction}
                title={actionTitle || actionText}
                style={{
                  minHeight: '44px',
                  padding: '0 20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                {actionIcon && <i>{actionIcon}</i>}
                <span>{actionText}</span>
              </button>
            )}
            {onSecondaryAction && secondaryActionText && (
              <button
                type="button"
                className="border round"
                onClick={onSecondaryAction}
                style={{
                  minHeight: '44px',
                  padding: '0 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                {secondaryActionIcon && <i>{secondaryActionIcon}</i>}
                <span>{secondaryActionText}</span>
              </button>
            )}
          </div>
        )}
      </Stack>
    </div>
  );
};
