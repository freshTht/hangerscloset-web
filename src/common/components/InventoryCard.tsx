import React from 'react';
import { LazyImage } from '../../components/LazyImage';
import './InventoryCard.css';

export type InventoryCardSize = 'sm' | 'md' | 'lg';
export type InventoryCardVariant = 'embedded' | 'outlined' | 'tonal';
export type InventoryCardRounding =
  | 'round'
  | 'medium-round'
  | 'small-round'
  | 'large-round'
  | 'no-round'
  | 'none';

export interface InventoryCardItemData {
  id?: string;
  code: string;
  name: string;
  imageUrl?: string | null;
  brand?: string | null;
  color?: string | null;
  size?: string | null;
  rentalPrices?: { durationDays: number; price: number }[];
  conditionNote?: string | null;
}

export interface InventoryCardProps {
  item: InventoryCardItemData;
  /** Size variant: 'sm' (compact row), 'md' (nested card), 'lg' (large card) */
  size?: InventoryCardSize;
  /** Surface variant: 'embedded' (surface inside nested card), 'outlined' (border + surface), 'tonal' (surface-container-low) */
  variant?: InventoryCardVariant;
  /** Border radius style: Beer CSS native classes 'round' | 'small-round' | 'large-round' | 'no-round' | 'none' (defaults to 'small-round') */
  rounding?: InventoryCardRounding;
  /** Optional click handler on the card */
  onClick?: () => void;
  /** Selected state highlight */
  selected?: boolean;
  /** Conflict / disabled visual state */
  hasConflict?: boolean;
  /** Slot rendered next to the item code/title in the top row (e.g. StatusBadge) */
  badgeSlot?: React.ReactNode;
  /** Slot rendered on the top-right of the title row */
  headerActionSlot?: React.ReactNode;
  /** Custom metadata line below the title (overrides default brand • color • size) */
  metaSlot?: React.ReactNode;
  /** Hide default brand/color/size attributes if metaSlot is not provided */
  hideDefaultMeta?: boolean;
  /** Additional note or warning below metadata (e.g. conditionNote or conflict text) */
  noteSlot?: React.ReactNode;
  /** Action slot vertically centered on the trailing right edge of the main row */
  trailingActionSlot?: React.ReactNode;
  /** Left side of the bottom bar (e.g. price display like "฿ 785") */
  footerLeftSlot?: React.ReactNode;
  /** Right side of the bottom bar (e.g. primary action button like "จองชุดนี้" or status advance button) */
  footerRightSlot?: React.ReactNode;
  /** Optional full-width bottom slot (e.g. subsequent block warning or price tiers) */
  bottomSlot?: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
  /** data-testid attribute */
  testId?: string;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({
  item,
  size = 'md',
  variant = 'embedded',
  rounding = 'small-round',
  onClick,
  selected = false,
  hasConflict = false,
  badgeSlot,
  headerActionSlot,
  metaSlot,
  hideDefaultMeta = false,
  noteSlot,
  trailingActionSlot,
  footerLeftSlot,
  footerRightSlot,
  bottomSlot,
  className = '',
  testId,
}) => {
  const getVariantClass = () => {
    const roundCls = rounding && rounding !== 'none' ? `${rounding} ` : '';
    switch (variant) {
      case 'outlined':
        return `border ${roundCls}surface`.trim();
      case 'tonal':
        return `${roundCls}surface-container-low`.trim();
      case 'embedded':
      default:
        return `${roundCls}surface`.trim();
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'hc-common-inv-card-sm';
      case 'lg':
        return 'hc-common-inv-card-lg';
      case 'md':
      default:
        return 'hc-common-inv-card-md';
    }
  };

  const sizeClass = getSizeClass();

  const stateClasses = [
    onClick ? 'hc-common-inv-card-clickable' : '',
    selected ? 'hc-common-inv-card-selected' : '',
    hasConflict && !selected ? 'hc-common-inv-card-conflict' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const hasDefaultMeta = Boolean(item.brand || item.color || item.size);
  const showFooter = Boolean(footerLeftSlot || footerRightSlot);

  const renderDefaultMeta = () => {
    if (hideDefaultMeta || !hasDefaultMeta) return null;
    const parts: React.ReactNode[] = [];

    if (item.brand) {
      parts.push(
        <span key="brand" className="hc-common-inv-card-attr">
          <i className="tiny">sell</i>
          <b className="on-surface-text">{item.brand}</b>
        </span>
      );
    }

    if (item.color) {
      parts.push(
        <span key="color" className="hc-common-inv-card-attr">
          <i className="tiny">palette</i>
          <span>{item.color}</span>
        </span>
      );
    }

    if (item.size) {
      parts.push(
        <span key="size" className="hc-common-inv-card-attr">
          <i className="tiny">height</i>
          <b>{item.size}</b>
        </span>
      );
    }

    return (
      <div className="hc-micro-text secondary-text hc-common-inv-card-meta">
        {parts.map((part, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="medium-opacity">•</span>}
            {part}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const Tag = variant === 'embedded' ? 'div' : 'article';

  return (
    <Tag
      className={`no-margin hc-common-inv-card ${getVariantClass()} ${sizeClass} ${stateClasses} ${className}`.trim()}
      onClick={onClick}
      data-testid={testId}
    >
      {/* Main Row: Thumbnail + Item Info + Optional Trailing Action */}
      <div className="hc-common-inv-card-main">
        <div className="small-round surface-container-high hc-common-inv-card-thumb">
          {item.imageUrl ? (
            <LazyImage
              src={item.imageUrl}
              alt={item.name}
              containerClassName="hc-common-inv-card-thumb-img"
              className="hc-common-inv-card-thumb-img-el"
            />
          ) : (
            <div className="hc-common-inv-card-thumb-placeholder">
              <i className="secondary-text">checkroom</i>
            </div>
          )}
        </div>

        <div className="hc-common-inv-card-body">
          <div className="hc-common-inv-card-top-row">
            <div className="hc-common-inv-card-title-group">
              <span className="chip tiny surface-container-high bold no-margin hc-micro-text hc-common-inv-card-code">
                {item.code}
              </span>
              <span
                className={`bold ${size === 'sm' ? 'small-text' : 'medium-text'} hc-common-inv-card-title`}
              >
                {item.name}
              </span>
              {badgeSlot}
            </div>

            {headerActionSlot}
          </div>

          {metaSlot !== undefined ? (
            <div className="hc-micro-text secondary-text hc-common-inv-card-meta">
              {metaSlot}
            </div>
          ) : (
            renderDefaultMeta()
          )}

          {noteSlot ? (
            <div className="hc-common-inv-card-note">{noteSlot}</div>
          ) : (
            item.conditionNote && (
              <div
                className="hc-micro-text round secondary-container hc-common-inv-card-note"
                title={item.conditionNote}
                data-testid={item.code ? `condition-note-${item.code}` : undefined}
              >
                <i className="tiny">sticky_note_2</i>
                <span className="truncate">
                  {item.conditionNote}
                </span>
              </div>
            )
          )}
        </div>

        {trailingActionSlot && (
          <div className="hc-common-inv-card-trailing">
            {trailingActionSlot}
          </div>
        )}
      </div>

      {/* Bottom Row: Price / Left Slot & Primary Action / Right Slot */}
      {showFooter && (
        <div className="hc-common-inv-card-footer">
          {footerLeftSlot && (
            <div className="hc-common-inv-card-footer-left">
              {footerLeftSlot}
            </div>
          )}
          {footerRightSlot && (
            <div className="hc-common-inv-card-footer-right">
              {footerRightSlot}
            </div>
          )}
        </div>
      )}

      {/* Optional Full-Width Bottom Slot */}
      {bottomSlot && (
        <div className="hc-common-inv-card-bottom">{bottomSlot}</div>
      )}
    </Tag>
  );
};
