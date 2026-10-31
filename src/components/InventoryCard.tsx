import React from 'react';
import type { InventoryItem } from '../types/inventory';
import { useIsMobile } from '../hooks/useIsMobile';
import { LazyImage } from './LazyImage';

interface InventoryCardProps {
  item: InventoryItem;
  onEdit?: (item: InventoryItem) => void;
}

const formatPrice = (amount: number): string =>
  `฿${amount.toLocaleString('en-US')}`;

export const InventoryCard: React.FC<InventoryCardProps> = ({ item, onEdit }) => {
  const isMobile = useIsMobile();

  const renderPrices = () => {
    const sortedTiers = [...(item.rentalPrices || [])].sort(
      (a, b) => a.durationDays - b.durationDays
    );
    if (sortedTiers.length === 0) return null;

    return (
      <div
        className="row no-space max no-margin"
        data-testid="price-tiers-group"
        style={{ width: '100%' }}
      >
        {sortedTiers.map((tier, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === sortedTiers.length - 1;
          const roundClass =
            sortedTiers.length === 1
              ? 'round'
              : isFirst
              ? 'left-round'
              : isLast
              ? 'right-round'
              : 'no-round';

          return (
            <div
              key={tier.durationDays}
              data-testid={`price-tier-${tier.durationDays}`}
              className={`${roundClass} max vertical center-align middle-align surface-container-high small-text no-margin`}
              style={{
                padding: '6px 4px',
                gap: '2px',
                borderRight: !isLast ? '1px solid var(--surface-variant)' : undefined,
              }}
            >
              <span className="secondary-text micro-text">{tier.durationDays} วัน</span>
              <span className="bold on-surface-text">{formatPrice(tier.price)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAttributes = () => (
    <div
      className="row no-margin tiny-space small-text secondary-text wrap"
      style={{ alignItems: 'center', gap: '8px' }}
    >
      <span
        className="middle-align"
        style={{ gap: '4px', alignItems: 'center', whiteSpace: 'nowrap' }}
        title={`แบรนด์: ${item.brand}`}
      >
        <i className="tiny">sell</i>
        <b className="on-surface-text">{item.brand}</b>
      </span>
      <span className="medium-opacity">•</span>
      <span
        className="middle-align"
        style={{ gap: '4px', alignItems: 'center', whiteSpace: 'nowrap' }}
        title={`สี: ${item.color}`}
      >
        <i className="tiny">palette</i>
        <span className="on-surface-text">{item.color}</span>
      </span>
      <span className="medium-opacity">•</span>
      <span
        className="middle-align"
        style={{ gap: '4px', alignItems: 'center', whiteSpace: 'nowrap' }}
        title={`ไซส์: ${item.size}`}
      >
        <i className="tiny">height</i>
        <b className="on-surface-text">{item.size}</b>
      </span>
    </div>
  );

  if (isMobile) {
    return (
      <article
        className="no-padding round row no-space no-scroll"
        style={{
          minHeight: '160px',
          alignItems: 'stretch',
        }}
      >
        <LazyImage
          className="left-round"
          src={item.imageUrl}
          alt={item.name}
          containerStyle={{
            width: 120,
            minWidth: 120,
            maxWidth: 120,
            alignSelf: 'stretch',
            flexShrink: 0,
          }}
        />
        <div
          className="max vertical"
          style={{
            minWidth: 0,
            padding: '10px 14px 10px 12px',
          }}
        >
          {/* Top: Code, Edit Action, and Title */}
          <div className="vertical" style={{ gap: '4px' }}>
            <div className="row no-margin align-center no-space" style={{ gap: '6px' }}>
              <span className="micro-text secondary-text medium">
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
                  style={{ width: '28px', height: '28px', minWidth: '28px', minHeight: '28px', padding: 0 }}
                >
                  <i className="tiny">edit</i>
                </button>
              )}
            </div>

            {/* Title: 2 lines max with Beer typography h6.small.bold */}
            <h6
              className="small bold no-margin"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.25,
              }}
            >
              {item.name}
            </h6>
          </div>

          {/* Anything below card title is bottom aligned with margin-top: auto */}
          <div className="vertical" style={{ marginTop: 'auto' }}>
            {renderAttributes()}
            <div style={{ marginTop: '8px' }}>
              {renderPrices()}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="no-padding round vertical"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <LazyImage
        className="top-round"
        src={item.imageUrl}
        alt={item.name}
        containerStyle={{
          width: '100%',
          aspectRatio: '1 / 1',
        }}
      />
      <div
        className="padding vertical"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {/* Top: Code, Edit Action, and Title */}
        <div className="vertical" style={{ gap: '6px' }}>
          <div className="row no-margin align-center" style={{ gap: '6px' }}>
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
                style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', padding: 0 }}
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
        <div className="vertical" style={{ marginTop: 'auto' }}>
          {renderAttributes()}
          <div style={{ marginTop: '12px' }}>
            {renderPrices()}
          </div>
        </div>
      </div>
    </article>
  );
};
