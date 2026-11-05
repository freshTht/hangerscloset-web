import React, { useState } from 'react';
import type { InventoryItem } from '../types/inventory';
import {
  BOOKING_STATUS_META,
  formatDateThaiShort,
  getEffectiveBookingStatus,
  getSubsequentStatusBlock,
  getTodayISO,
  type Booking,
  type BookingLineItem,
  type BookingItemStatus,
} from '../types/booking';
import { LazyImage } from './LazyImage';
import { StatusBadge } from './StatusBadge';
import './BookingInventoryCard.css';

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
    nextStatus: BookingItemStatus,
    effectiveDate?: string
  ) => Promise<void> | void;
}

export const BookingInventoryCard: React.FC<BookingInventoryCardProps> = ({
  item,
  booking,
  lineItem,
  selectedDate,
  isAllDates,
  onReserve,
  onEditBooking,
  onAdvanceItemStatus,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const effectiveActionDate = isAllDates ? getTodayISO() : selectedDate;

  const handleAdvanceStatus = async (
    bookingId: string,
    itemId: string,
    nextStatus: BookingItemStatus
  ) => {
    try {
      setIsUpdating(true);
      await onAdvanceItemStatus(
        bookingId,
        itemId,
        nextStatus,
        effectiveActionDate
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const isBooked = Boolean(booking && lineItem);
  const computedStatus = booking
    ? getEffectiveBookingStatus(booking, selectedDate, isAllDates)
    : null;
  const meta = computedStatus ? BOOKING_STATUS_META[computedStatus] : null;
  const subsequentBlock =
    booking && meta?.nextStatus
      ? getSubsequentStatusBlock(booking, effectiveActionDate, meta.nextStatus)
      : null;

  return (
    <article
      className="no-padding round row no-space no-scroll border surface hc-booking-inv-card"
      data-testid={`inventory-booking-card-${item.code}`}
    >
      {/* Left Column: Image */}
      <LazyImage
        className="left-round"
        src={item.imageUrl}
        alt={item.name}
        containerClassName="hc-booking-inv-card-image"
      />

      {/* Right Column: Information & Actions */}
      <div className="max vertical hc-booking-inv-card-content">
        {/* Top: Code, Status Badge, Edit Button */}
        <div className="hc-booking-inv-card-header">
          <div className="row no-margin align-center no-space hc-booking-inv-card-header-top">
            <span className="hc-micro-text secondary-text bold">{item.code}</span>

            {isBooked && meta ? (
              <StatusBadge
                size="small"
                className={meta.chipClass}
                data-testid={`status-badge-${item.code}`}
              >
                {meta.label}
              </StatusBadge>
            ) : (
              <span
                className="chip tiny fill primary-container bold no-margin hc-booking-inv-card-available-chip"
                data-testid={`status-badge-${item.code}`}
              >
                <i>check_circle</i>
                <span>ว่าง (พร้อมเช่า)</span>
              </span>
            )}

            <div className="max" />

            {isBooked && booking && (
              <button
                type="button"
                className="circle transparent no-margin hc-booking-inv-card-edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditBooking(booking);
                }}
                aria-label={`แก้ไขการจอง ${item.code}`}
                title="แก้ไขการจอง"
              >
                <i className="tiny">edit</i>
              </button>
            )}
          </div>

          {/* Title */}
          <h6 className="small bold no-margin hc-booking-inv-card-title">
            {item.name}
          </h6>
        </div>

        {/* Item Attributes */}
        <div className="row no-margin tiny-space hc-micro-text secondary-text wrap hc-booking-inv-card-attrs">
          {item.brand && (
            <span className="middle-align hc-booking-inv-card-attr-item">
              <i className="tiny">sell</i>
              <b className="on-surface-text">{item.brand}</b>
            </span>
          )}
          {item.color && (
            <>
              <span className="medium-opacity">•</span>
              <span className="middle-align hc-booking-inv-card-attr-item">
                <i className="tiny">palette</i>
                <span>{item.color}</span>
              </span>
            </>
          )}
          {item.size && (
            <>
              <span className="medium-opacity">•</span>
              <span className="middle-align hc-booking-inv-card-attr-item">
                <i className="tiny">height</i>
                <b>{item.size}</b>
              </span>
            </>
          )}
        </div>

        {/* Booking Details if booked */}
        {isBooked && booking && (
          <div className="round surface-container-low small-text hc-booking-inv-card-details">
            <div className="row no-margin align-center no-space hc-booking-inv-card-customer-row">
              <i className="tiny primary-text">person</i>
              <b className="truncate on-surface-text">{booking.customerName}</b>
              {booking.customerPhone && (
                <span className="secondary-text hc-micro-text truncate">
                  ({booking.customerPhone})
                </span>
              )}
            </div>
            <div className="row no-margin align-center no-space hc-booking-inv-card-date-row">
              <i className="tiny secondary-text">date_range</i>
              <span className="secondary-text hc-micro-text">
                {formatDateThaiShort(booking.startDate)} –{' '}
                {formatDateThaiShort(booking.endDate)}
              </span>
            </div>
          </div>
        )}

        {/* Action Area at bottom */}
        <div className="vertical hc-booking-inv-card-actions">
          {isBooked && booking && lineItem && meta ? (
            <div className="vertical hc-booking-inv-card-action-group">
              <div className="row no-margin align-center hc-booking-inv-card-action-row">
                {meta.nextStatus && meta.nextActionLabel && (
                  <button
                    type="button"
                    className="small round border primary bold no-margin max small-text hc-booking-inv-card-advance-btn"
                    disabled={isUpdating || Boolean(subsequentBlock)}
                    onClick={() =>
                      handleAdvanceStatus(
                        booking.id,
                        lineItem.itemId,
                        meta.nextStatus!
                      )
                    }
                    aria-label={`ปรับสถานะ ${item.code} เป็น ${meta.nextActionLabel}`}
                    title={
                      subsequentBlock
                        ? `ไม่สามารถเปลี่ยนสถานะในวันนี้ได้ เนื่องจากวันที่ ${formatDateThaiShort(subsequentBlock.date)} ได้อัปเดตเป็น "${BOOKING_STATUS_META[subsequentBlock.status].label}" แล้ว`
                        : undefined
                    }
                  >
                    {isUpdating ? (
                      <div className="shape loading-indicator tiny" role="status" />
                    ) : (
                      <>
                        <i>{subsequentBlock ? 'lock' : 'arrow_forward'}</i>
                        <span className="hc-booking-inv-card-advance-label">
                          {meta.nextActionLabel}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
              {subsequentBlock && (
                <span
                  className="hc-micro-text error-text"
                  data-testid={`subsequent-block-msg-${item.code}`}
                >
                  อัปเดตเป็น "{BOOKING_STATUS_META[subsequentBlock.status].label}" เมื่อ{' '}
                  {formatDateThaiShort(subsequentBlock.date)} แล้ว
                </span>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="small round fill primary bold no-margin max hc-booking-inv-card-reserve-btn"
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
