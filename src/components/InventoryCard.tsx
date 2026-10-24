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
    <article className="inventory-card no-padding round border">
      <img
        className="inventory-card-photo"
        src={item.imageUrl}
        alt={item.name}
        loading="lazy"
      />
      <div className="padding">
        <h5 className="no-margin bold">{item.name}</h5>
        <p className="no-margin secondary-text">{item.code}</p>

        <div className="space"></div>

        <div className="row no-margin">
          <span className="secondary-text">แบรนด์</span>
          <span className="max"></span>
          <span>{item.brand}</span>
        </div>
        <div className="row no-margin">
          <span className="secondary-text">สี</span>
          <span className="max"></span>
          <span>{item.color}</span>
        </div>
        <div className="row no-margin">
          <span className="secondary-text">ไซส์</span>
          <span className="max"></span>
          <span>{item.size}</span>
        </div>

        <div className="space"></div>

        <p className="no-margin secondary-text">ราคาเช่า</p>
        <div className="row no-margin">
          <span className="secondary-text">1 วัน</span>
          <span className="max"></span>
          <span>{formatPrice(item.rentalPrices.oneDay)}</span>
        </div>
        <div className="row no-margin">
          <span className="secondary-text">3 วัน</span>
          <span className="max"></span>
          <span>{formatPrice(item.rentalPrices.threeDays)}</span>
        </div>
        <div className="row no-margin">
          <span className="secondary-text">5 วัน</span>
          <span className="max"></span>
          <span>{formatPrice(item.rentalPrices.fiveDays)}</span>
        </div>

        <div className="space"></div>

        <span className={`chip fill ${status.chipClass}`}>{status.label}</span>
      </div>
    </article>
  );
};
