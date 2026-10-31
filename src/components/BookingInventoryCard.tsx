import React, { useState } from 'react';
import type { InventoryItem } from '../types/inventory';
import {
  BOOKING_STATUS_META,
  formatDateThaiShort,
  type Booking,
  type BookingLineItem,
  type BookingItemStatus,
} from '../types/booking';
import { LazyImage } from './LazyImage';

export interface BookingInventoryCardProps {
  item: InventoryItem;
  booking: Booking | null;
  lineItem: BookingLineItem | null;
  selectedDate: string;
  isAllDates: boolean;
  onReserve: (item: InventoryItem) => void;
  onEditBooking: (booking: Booking) => void;
  onAdvanceItemStatus: (
    bookingId: string,
    itemId: string,
    nextStatus: BookingItemStatus
  ) => Promise<void> | void;
}

export const BookingInventoryCard: React.FC<BookingInventoryCardProps> = ({
  item,
  booking,
  lineItem,
  onReserve,
  onEditBooking,
  onAdvanceItemStatus,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAdvanceStatus = async (
    bookingId: string,
    itemId: string,
    nextStatus: BookingItemStatus
  ) => {
    try {
      setIsUpdating(true);
      await onAdvanceItemStatus(bookingId, itemId, nextStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const isBooked = Boolean(booking && lineItem);
  const meta = lineItem ? BOOKING_STATUS_META[lineItem.status] : null;

  return (
    <article
      className="no-padding round row no-space no-scroll border surface"
      data-testid={`inventory-booking-card-${item.code}`}
      style={{
        minHeight: '160px',
        alignItems: 'stretch',
      }}
    >
      {/* Left Column: Image */}
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

      {/* Right Column: Information & Actions */}
      <div
        className="max vertical"
        style={{
          minWidth: 0,
          padding: '10px 14px 10px 12px',
        }}
      >
        {/* Top: Code, Status Badge, Edit Button */}
        <div className="vertical" style={{ gap: '4px' }}>
          <div
            className="row no-margin align-center no-space"
            style={{ gap: '6px' }}
          >
            <span className="micro-text secondary-text bold">{item.code}</span>

            {isBooked && meta ? (
              <span
                className={`status-badge small ${meta.chipClass}`}
                data-testid={`status-badge-${item.code}`}
              >
                {meta.label}
              </span>
            ) : (
              <span
                className="chip tiny fill primary-container bold no-margin"
                data-testid={`status-badge-${item.code}`}
                style={{ height: '22px' }}
              >
                <i>check_circle</i>
                <span>ว่าง (พร้อมเช่า)</span>
              </span>
            )}

            <div className="max" />

            {isBooked && booking && (
              <button
                type="button"
                className="circle transparent no-margin"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditBooking(booking);
                }}
                aria-label={`แก้ไขการจอง ${item.code}`}
                title="แก้ไขการจอง"
                style={{
                  width: '28px',
                  height: '28px',
                  minWidth: '28px',
                  minHeight: '28px',
                  padding: 0,
                }}
              >
                <i className="tiny">edit</i>
              </button>
            )}
          </div>

          {/* Title */}
          <h6
            className="small bold no-margin"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.25,
            }}
          >
            {item.name}
          </h6>
        </div>

        {/* Item Attributes */}
        <div
          className="row no-margin tiny-space micro-text secondary-text wrap"
          style={{ alignItems: 'center', gap: '6px', marginTop: '2px' }}
        >
          {item.brand && (
            <span className="middle-align" style={{ gap: '2px' }}>
              <i className="tiny">sell</i>
              <b className="on-surface-text">{item.brand}</b>
            </span>
          )}
          {item.color && (
            <>
              <span className="medium-opacity">•</span>
              <span className="middle-align" style={{ gap: '2px' }}>
                <i className="tiny">palette</i>
                <span>{item.color}</span>
              </span>
            </>
          )}
          {item.size && (
            <>
              <span className="medium-opacity">•</span>
              <span className="middle-align" style={{ gap: '2px' }}>
                <i className="tiny">height</i>
                <b>{item.size}</b>
              </span>
            </>
          )}
        </div>

        {/* Booking Details if booked */}
        {isBooked && booking && (
          <div
            className="round surface-container-low"
            style={{
              padding: '6px 8px',
              marginTop: '6px',
              fontSize: '12px',
            }}
          >
            <div
              className="row no-margin align-center no-space"
              style={{ gap: '4px' }}
            >
              <i className="tiny primary-text">person</i>
              <b className="truncate on-surface-text">{booking.customerName}</b>
              {booking.customerPhone && (
                <span className="secondary-text micro-text truncate">
                  ({booking.customerPhone})
                </span>
              )}
            </div>
            <div
              className="row no-margin align-center no-space"
              style={{ gap: '4px', marginTop: '2px' }}
            >
              <i className="tiny secondary-text">date_range</i>
              <span className="secondary-text micro-text">
                {formatDateThaiShort(booking.startDate)} –{' '}
                {formatDateThaiShort(booking.endDate)}
              </span>
            </div>
          </div>
        )}

        {/* Action Area at bottom */}
        <div className="vertical" style={{ marginTop: 'auto', paddingTop: '8px' }}>
          {isBooked && booking && lineItem && meta ? (
            <div className="row no-margin align-center" style={{ gap: '6px' }}>
              {meta.nextStatus && meta.nextActionLabel && (
                <button
                  type="button"
                  className="small round border primary bold no-margin max"
                  disabled={isUpdating}
                  onClick={() =>
                    handleAdvanceStatus(
                      booking.id,
                      lineItem.itemId,
                      meta.nextStatus!
                    )
                  }
                  aria-label={`ปรับสถานะ ${item.code} เป็น ${meta.nextActionLabel}`}
                >
                  {isUpdating ? (
                    <div className="shape loading-indicator tiny" role="status" />
                  ) : (
                    <>
                      <i>arrow_forward</i>
                      <span>{meta.nextActionLabel}</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                className="small round transparent border no-margin"
                onClick={() => onEditBooking(booking)}
                title="แก้ไขการจอง"
              >
                <i>edit</i>
                <span>แก้ไข</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="small round fill primary bold no-margin max"
              onClick={() => onReserve(item)}
              aria-label={`จองชุด ${item.code}`}
              title="สร้างการจองสำหรับชุดนี้"
            >
              <i>add</i>
              <span>จองชุดนี้</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
