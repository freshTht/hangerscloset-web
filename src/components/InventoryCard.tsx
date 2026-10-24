import React from 'react';
import type { InventoryItem, InventoryStatus } from '../types/inventory';

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
  const status = STATUS_META[item.status];

  return (
    <article className="inventory-card no-padding border">
      <img
        className="inventory-card-photo"
        src={item.imageUrl}
        alt={item.name}
        loading="lazy"
      />
      <div className="inventory-card-content padding">
        {/* Top: Code & Status Chip */}
        <div className="card-top-row">
          <span className="secondary-text small-text">{item.code}</span>
          <span className={`chip fill ${status.chipClass} no-margin card-status-chip`}>
            {status.label}
          </span>
        </div>

        {/* Outfit Name */}
        <div className="card-title bold">
          {item.name}
        </div>

        {/* Middle: Attributes (Brand, Color, Size) */}
        <div className="card-attributes small-text">
          <span>
            <span className="secondary-text">แบรนด์: </span>
            <span className="bold">{item.brand}</span>
          </span>
          <span className="attr-dot">•</span>
          <span>
            <span className="secondary-text">สี: </span>
            <span>{item.color}</span>
          </span>
          <span className="attr-dot">•</span>
          <span>
            <span className="secondary-text">ไซส์: </span>
            <span className="bold">{item.size}</span>
          </span>
        </div>

        {/* Bottom: Compact Rental Prices */}
        <div className="card-prices round">
          <div className="price-item">
            <span className="secondary-text small-text">1 วัน</span>
            <span className="bold medium-text">{formatPrice(item.rentalPrices.oneDay)}</span>
          </div>
          <div className="price-divider"></div>
          <div className="price-item">
            <span className="secondary-text small-text">3 วัน</span>
            <span className="bold medium-text">{formatPrice(item.rentalPrices.threeDays)}</span>
          </div>
          <div className="price-divider"></div>
          <div className="price-item">
            <span className="secondary-text small-text">5 วัน</span>
            <span className="bold medium-text">{formatPrice(item.rentalPrices.fiveDays)}</span>
          </div>
        </div>
      </div>
    </article>
  );
};
