import React from 'react';
import type { InventoryItem, InventoryStatus } from '../types/inventory';
import { useIsMobile } from '../hooks/useIsMobile';

interface InventoryCardProps {
  item: InventoryItem;
}

const STATUS_META: Record<InventoryStatus, { label: string; chipClass: string }> = {
  available: { label: 'พร้อมเช่า', chipClass: 'green' },
  reserved: { label: 'จองแล้ว', chipClass: 'orange' },
  laundry: { label: 'ส่งซัก', chipClass: 'blue' },
};

const formatPrice = (amount: number): string =>
  `฿${amount.toLocaleString('en-US')}`;

export const InventoryCard: React.FC<InventoryCardProps> = ({ item }) => {
  const isMobile = useIsMobile();
  const status = STATUS_META[item.status];

  const renderPrices = () => (
    <nav className="no-margin">
      <div
        className="row surface-container round no-margin center-align max"
        style={{
          padding: isMobile ? '0.2rem 0.35rem' : '0.35rem 0.5rem',
          borderRadius: isMobile ? '0.375rem' : '0.5rem',
          justifyContent: 'space-around',
          gap: 0,
        }}
      >
        <div className="center-align">
          <div className="small-text secondary-text" style={{ fontSize: isMobile ? '0.625rem' : undefined }}>
            1 วัน
          </div>
          <div className={`bold ${isMobile ? 'small-text' : 'medium-text'}`}>
            {formatPrice(item.rentalPrices.oneDay)}
          </div>
        </div>
        <div className="divider vertical" style={{ minBlockSize: isMobile ? '1.15rem' : '1.5rem' }}></div>
        <div className="center-align">
          <div className="small-text secondary-text" style={{ fontSize: isMobile ? '0.625rem' : undefined }}>
            3 วัน
          </div>
          <div className={`bold ${isMobile ? 'small-text' : 'medium-text'}`}>
            {formatPrice(item.rentalPrices.threeDays)}
          </div>
        </div>
        <div className="divider vertical" style={{ minBlockSize: isMobile ? '1.15rem' : '1.5rem' }}></div>
        <div className="center-align">
          <div className="small-text secondary-text" style={{ fontSize: isMobile ? '0.625rem' : undefined }}>
            5 วัน
          </div>
          <div className={`bold ${isMobile ? 'small-text' : 'medium-text'}`}>
            {formatPrice(item.rentalPrices.fiveDays)}
          </div>
        </div>
      </div>
    </nav>
  );

  if (isMobile) {
    return (
      <article
        className="no-padding round row no-space"
        style={{
          height: 160,
          minHeight: 160,
          maxHeight: 160,
          alignItems: 'stretch',
          overflow: 'hidden',
        }}
      >
        <img
          className="left-round"
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          style={{
            width: 120,
            minWidth: 120,
            maxWidth: 120,
            height: 160,
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
        <div
          className="small-padding max vertical"
          style={{
            minWidth: 0,
            height: 160,
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Row: Code & Status */}
          <div className="row no-margin align-center no-space">
            <span className="small-text secondary-text">{item.code}</span>
            <div className="max"></div>
            <span
              className={`chip small fill ${status.chipClass} no-margin`}
              style={{
                minHeight: '1.35rem',
                height: '1.35rem',
                padding: '0 0.5rem',
                borderRadius: '0.35rem',
              }}
            >
              <span className="small-text" style={{ fontSize: '0.6875rem', lineHeight: 1 }}>
                {status.label}
              </span>
            </span>
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
              fontSize: '0.875rem',
            }}
          >
            {item.name}
          </h6>

          {/* Attributes: small-text with truncate */}
          <p className="small-text secondary-text no-margin truncate" style={{ fontSize: '0.6875rem' }}>
            แบรนด์: <b className="on-surface-text">{item.brand}</b> • สี: <span className="on-surface-text">{item.color}</span> • ไซส์: <b className="on-surface-text">{item.size}</b>
          </p>

          {/* Rental Prices */}
          {renderPrices()}
        </div>
      </article>
    );
  }

  return (
    <article
      className="no-padding round vertical"
      style={{ height: '100%' }}
    >
      <img
        className="responsive small top-round"
        src={item.imageUrl}
        alt={item.name}
        loading="lazy"
      />
      <div
        className="padding max vertical"
        style={{ justifyContent: 'space-between', gap: '0.75rem' }}
      >
        {/* Top Row: Code & Status */}
        <div className="row no-margin align-center">
          <span className="small-text secondary-text">{item.code}</span>
          <div className="max"></div>
          <span className={`chip small fill ${status.chipClass} no-margin`}>
            <span className="small-text">{status.label}</span>
          </span>
        </div>

        {/* Title: Beer typography h6 */}
        <h6 className="bold no-margin">
          {item.name}
        </h6>

        {/* Attributes: Beer typography small-text */}
        <p className="small-text secondary-text no-margin">
          แบรนด์: <b className="on-surface-text">{item.brand}</b> • สี: <span className="on-surface-text">{item.color}</span> • ไซส์: <b className="on-surface-text">{item.size}</b>
        </p>

        {/* Rental Prices */}
        {renderPrices()}
      </div>
    </article>
  );
};
