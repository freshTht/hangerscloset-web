import React from 'react';
import './ConnectedButtons.css';

export interface ConnectedButtonItem<T extends string = string> {
  value: T;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  ariaLabel?: string;
  title?: string;
  disabled?: boolean;
  testId?: string;
}

export interface ConnectedButtonsProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  items: ConnectedButtonItem<T>[];
  size?: 'small' | 'medium' | 'large';
  className?: string;
  testId?: string;
  ariaLabel?: string;
}

/**
 * ConnectedButtons - Reusable segmented button selector adhering to Beer CSS `nav.group.connected`.
 * Allows selecting a single value from a mutually exclusive set of options.
 */
export function ConnectedButtons<T extends string = string>({
  value,
  onChange,
  items,
  size = 'small',
  className = '',
  testId,
  ariaLabel,
}: ConnectedButtonsProps<T>): React.ReactElement {
  const getItemRoundClass = (index: number, total: number): string => {
    if (total <= 1) return 'round';
    if (index === 0) return 'left-round';
    if (index === total - 1) return 'right-round';
    return 'no-round';
  };

  return (
    <nav
      className={`group connected no-margin hc-connected-buttons ${size} ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {items.map((item, index) => {
        const isSelected = item.value === value;
        const roundClass = getItemRoundClass(index, items.length);

        return (
          <button
            key={item.value}
            type="button"
            className={`${roundClass} ${isSelected ? 'active' : ''} ${size} no-margin hc-connected-button`.trim()}
            onClick={() => {
              if (!item.disabled && item.value !== value) {
                onChange(item.value);
              }
            }}
            disabled={item.disabled}
            aria-pressed={isSelected}
            aria-label={item.ariaLabel}
            title={item.title ?? item.ariaLabel}
            data-testid={item.testId ?? `connected-btn-${item.value}`}
          >
            {typeof item.icon === 'string' ? (
              <i className={size === 'small' ? 'small' : ''} aria-hidden="true">
                {item.icon}
              </i>
            ) : (
              item.icon
            )}
            {item.label && <span className="hc-connected-button-label">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
