import React from 'react';
import type { InventoryItem } from '../types/inventory';
import { useIsMobile } from '../hooks/useIsMobile';
import { LazyImage } from './LazyImage';
import './InventoryCard.css';

interface InventoryCardProps {
  item: InventoryItem;
  onEdit?: (item: InventoryItem) => void;
}

const formatPrice = (amount: number): string =>
  `฿${amount.toLocaleString('en-US')}`;

const getTierRoundingClass = (index: number, totalTiers: number): string => {
  if (totalTiers === 1) return 'round';
  if (index === 0) return 'left-round';
  if (index === totalTiers - 1) return 'right-round';
  return 'no-round';
};

export const InventoryCard: React.FC<InventoryCardProps> = ({ item, onEdit }) => {
  const isMobile = useIsMobile();

  const renderPrices = () => {
    const sortedTiers = [...(item.rentalPrices || [])].sort(
      (a, b) => a.durationDays - b.durationDays
    );
    if (sortedTiers.length === 0) return null;

    return (
      <div
        className="row no-space max no-margin hc-inventory-card-prices"
        data-testid="price-tiers-group"
      >
        {sortedTiers.map((tier, idx) => {
          const roundClass = getTierRoundingClass(idx, sortedTiers.length);

          return (
            <div
              key={tier.durationDays}
              data-testid={`price-tier-${tier.durationDays}`}
              className={`${roundClass} max vertical center-align middle-align surface-container-high small-text no-margin hc-inventory-card-tier`}
            >
              <span className="secondary-text hc-micro-text">{tier.durationDays} วัน</span>
              <span className="bold on-surface-text">{formatPrice(tier.price)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAttributes = () => (
    <div className="row no-margin tiny-space small-text secondary-text wrap hc-inventory-card-attrs">
      <span
        className="middle-align hc-inventory-card-attr-item"
        title={`แบรนด์: ${item.brand}`}
      >
        <i className="tiny">sell</i>
        <b className="on-surface-text">{item.brand}</b>
      </span>
      <span className="medium-opacity">•</span>
      <span
        className="middle-align hc-inventory-card-attr-item"
        title={`สี: ${item.color}`}
      >
        <i className="tiny">palette</i>
        <span className="on-surface-text">{item.color}</span>
      </span>
      <span className="medium-opacity">•</span>
      <span
        className="middle-align hc-inventory-card-attr-item"
        title={`ไซส์: ${item.size}`}
      >
        <i className="tiny">height</i>
        <b className="on-surface-text">{item.size}</b>
      </span>
    </div>
  );

  if (isMobile) {
    return (
      <article className="no-padding round row no-space no-scroll hc-inventory-card-mobile">
        <LazyImage
          className="left-round"
          src={item.imageUrl}
          alt={item.name}
          containerClassName="hc-inventory-card-mobile-img"
        />
        <div className="max vertical hc-inventory-card-mobile-body">
          {/* Top: Code, Edit Action, and Title */}
          <div className="vertical hc-inventory-card-mobile-header">
            <div className="row no-margin align-center no-space hc-inventory-card-mobile-header-row">
              <span className="hc-micro-text secondary-text medium">
                {item.code}
              </span>
              <div className="max"></div>
              {onEdit && (
                <button
                  type="button"
                  className="circle transparent no-margin"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  aria-label={`แก้ไข ${item.code}`}
                  title="แก้ไขรายการ"
                >
                  <i className="tiny">edit</i>
                </button>
              )}
            </div>

            {/* Title: 2 lines max with Beer typography h6.small.bold */}
            <h6 className="small bold no-margin hc-inventory-card-title-clamped">
              {item.name}
            </h6>
          </div>

          {/* Anything below card title is bottom aligned with margin-top: auto */}
          <div className="vertical hc-inventory-card-bottom-section">
            {renderAttributes()}
            <div className="hc-inventory-card-bottom-spacer-mobile">
              {renderPrices()}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="no-padding round vertical hc-inventory-card-desktop">
      <LazyImage
        className="top-round"
        src={item.imageUrl}
        alt={item.name}
        containerClassName="hc-inventory-card-desktop-img"
      />
      <div className="padding vertical hc-inventory-card-desktop-body">
        {/* Top: Code, Edit Action, and Title */}
        <div className="vertical hc-inventory-card-desktop-header">
          <div className="row no-margin align-center hc-inventory-card-desktop-header-row">
            <span className="small-text secondary-text">{item.code}</span>
            <div className="max"></div>
            {onEdit && (
              <button
                type="button"
                className="circle transparent no-margin"
                onClick={(e) => {
                  e.stopPropagation();
                    onEdit(item);
                }}
                aria-label={`แก้ไข ${item.code}`}
                title="แก้ไขรายการ"
              >
                <i className="small">edit</i>
              </button>
            )}
          </div>

          {/* Title: Beer typography h6 */}
          <h6 className="bold no-margin">
            {item.name}
          </h6>
        </div>

        {/* Anything below card title is bottom aligned with margin-top: auto */}
        <div className="vertical hc-inventory-card-bottom-section">
          {renderAttributes()}
          <div className="hc-inventory-card-bottom-spacer-desktop">
            {renderPrices()}
          </div>
        </div>
      </div>
    </article>
  );
};
