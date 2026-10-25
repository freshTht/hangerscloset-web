import React from 'react';
import ui from 'beercss';
import type { InventoryItem, InventoryStatus } from '../types/inventory';
import { useIsMobile } from '../hooks/useIsMobile';
import { LazyImage } from './LazyImage';

interface InventoryCardProps {
  item: InventoryItem;
}

const STATUS_META: Record<InventoryStatus, { label: string }> = {
  available: { label: 'พร้อมเช่า' },
  reserved: { label: 'จองแล้ว' },
  laundry: { label: 'ส่งซัก' },
};

const formatPrice = (amount: number): string =>
  `฿${amount.toLocaleString('en-US')}`;

export const InventoryCard: React.FC<InventoryCardProps> = ({ item }) => {
  const isMobile = useIsMobile();
  const status = STATUS_META[item.status];

  const handlePriceAction = (e: React.MouseEvent, days: number, price: number) => {
    e.stopPropagation();
    const dialogId = isMobile ? 'dialog-coming-soon-s' : 'dialog-coming-soon-m';
    const dialog = document.getElementById(dialogId);
    if (dialog) {
      void ui(`#${dialogId}`);
    } else {
      alert(`เลือกเช่า ${days} วัน ราคา ${formatPrice(price)} (Coming soon)`);
    }
  };

  const renderPrices = () => (
    <nav className="group connected max no-margin">
      <button
        className="left-round max vertical small fill no-margin"
        type="button"
        onClick={(e) => handlePriceAction(e, 1, item.rentalPrices.oneDay)}
      >
        <span>1 วัน</span>
        <span className="bold">{formatPrice(item.rentalPrices.oneDay)}</span>
      </button>
      <button
        className="no-round max vertical small fill no-margin"
        type="button"
        onClick={(e) => handlePriceAction(e, 3, item.rentalPrices.threeDays)}
      >
        <span>3 วัน</span>
        <span className="bold">{formatPrice(item.rentalPrices.threeDays)}</span>
      </button>
      <button
        className="right-round max vertical small fill no-margin"
        type="button"
        onClick={(e) => handlePriceAction(e, 5, item.rentalPrices.fiveDays)}
      >
        <span>5 วัน</span>
        <span className="bold">{formatPrice(item.rentalPrices.fiveDays)}</span>
      </button>
    </nav>
  );

  const renderAttributes = () => (
    <div
      className="row no-margin tiny-space small-text secondary-text wrap"
      style={{ alignItems: 'center', gap: 8 }}
    >
      <span
        className="middle-align"
        style={{ gap: 4, alignItems: 'center', whiteSpace: 'nowrap' }}
        title={`แบรนด์: ${item.brand}`}
      >
        <i className="tiny">sell</i>
        <b className="on-surface-text">{item.brand}</b>
      </span>
      <span className="medium-opacity">•</span>
      <span
        className="middle-align"
        style={{ gap: 4, alignItems: 'center', whiteSpace: 'nowrap' }}
        title={`สี: ${item.color}`}
      >
        <i className="tiny">palette</i>
        <span className="on-surface-text">{item.color}</span>
      </span>
      <span className="medium-opacity">•</span>
      <span
        className="middle-align"
        style={{ gap: 4, alignItems: 'center', whiteSpace: 'nowrap' }}
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
          minHeight: 160,
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
          {/* Top: Code & Status, and Title */}
          <div className="vertical" style={{ gap: 4 }}>
            {/* Top Row: Code & Refined Status Badge */}
            <div className="row no-margin align-center no-space">
              <span className="micro-text secondary-text medium">
                {item.code}
              </span>
              <div className="max"></div>
              <span className={`status-badge small status-badge-${item.status}`}>
                {status.label}
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
              }}
            >
              {item.name}
            </h6>
          </div>

          {/* Anything below card title is bottom aligned with margin-top: auto */}
          <div className="vertical" style={{ marginTop: 'auto' }}>
            {/* Attributes with Sell, Palette, Height icons */}
            {renderAttributes()}

            {/* Price section with some margin top */}
            <div style={{ marginTop: 8 }}>
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
        {/* Top: Code & Status, and Title */}
        <div className="vertical" style={{ gap: 6 }}>
          <div className="row no-margin align-center">
            <span className="small-text secondary-text">{item.code}</span>
            <div className="max"></div>
            <span className={`status-badge status-badge-${item.status}`}>
              {status.label}
            </span>
          </div>

          {/* Title: Beer typography h6 */}
          <h6 className="bold no-margin">
            {item.name}
          </h6>
        </div>

        {/* Anything below card title is bottom aligned with margin-top: auto */}
        <div className="vertical" style={{ marginTop: 'auto' }}>
          {/* Attributes with Sell, Palette, Height icons */}
          {renderAttributes()}

          {/* Price section with some margin top */}
          <div style={{ marginTop: 12 }}>
            {renderPrices()}
          </div>
        </div>
      </div>
    </article>
  );
};
