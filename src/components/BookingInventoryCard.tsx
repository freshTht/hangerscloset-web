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
import { InventoryCard } from '../common/components/InventoryCard';
import './BookingInventoryCard.css';

export interface BookingInventoryCardProps {
  item: InventoryItem;
  booking: Booking | null;
  lineItem: BookingLineItem | null;
  selectedDate: string;
  isAllDates: boolean;
  onReserve: (item: InventoryItem) => void;
  onEditBooking: (booking: Booking) => void;
  onViewBooking?: (booking: Booking) => void;
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
  onViewBooking,
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
  const isReturned = computedStatus === 'returned';
  const meta = computedStatus ? BOOKING_STATUS_META[computedStatus] : null;
  const subsequentBlock =
    booking && meta?.nextStatus
      ? getSubsequentStatusBlock(booking, effectiveActionDate, meta.nextStatus)
      : null;

  const sortedTiers = [...(item.rentalPrices ?? [])].sort(
    (a, b) => a.durationDays - b.durationDays
  );
  const startingTier = sortedTiers[0] ?? null;

  const renderPrice = () => {
    if (isBooked && booking) {
      return (
        <div className="hc-booking-inv-card-price">
          <span className="bold primary-text medium-text">
            ฿{booking.rentalPrice.toLocaleString()}
          </span>
        </div>
      );
    }

    if (startingTier) {
      return (
        <div className="hc-booking-inv-card-price">
          <span className="bold primary-text medium-text">
            ฿{startingTier.price.toLocaleString()}
          </span>
          <span className="hc-micro-text secondary-text">
            / {startingTier.durationDays} วัน
          </span>
        </div>
      );
    }

    return null;
  };

  const renderActionRight = () => {
    if (isBooked) {
      if (booking && lineItem && meta && meta.nextStatus && meta.nextActionLabel) {
        return (
          <button
            type="button"
            className="small round border primary bold no-margin small-text hc-booking-inv-card-advance-btn"
            disabled={isUpdating || Boolean(subsequentBlock)}
            onClick={() =>
              handleAdvanceStatus(booking.id, lineItem.itemId, meta.nextStatus!)
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
        );
      }
      return null;
    }

    return (
      <button
        type="button"
        className="small round border primary bold no-margin hc-booking-inv-card-reserve-btn"
        onClick={() => onReserve(item)}
        aria-label={`จองชุด ${item.code}`}
        title="สร้างการจองสำหรับชุดนี้"
      >
        <i>add</i>
        <span>จองชุดนี้</span>
      </button>
    );
  };

  return (
    <article
      className="border medium-round no-margin hc-booking-inv-card"
      data-testid={`inventory-booking-card-${item.code}`}
    >
      {/* Accessible status indicator for screen readers and semantic queries */}
      {isBooked && booking && meta ? (
        <span
          className="sr-only"
          data-testid={`status-badge-${item.code}`}
        >
          {meta.label}
        </span>
      ) : (
        <span
          className="sr-only"
          data-testid={`status-badge-${item.code}`}
        >
          ว่าง (พร้อมเช่า)
        </span>
      )}

      {/* Inner Level: Inventory Item Info */}
      <InventoryCard
        item={{
          id: item.id,
          code: item.code,
          name: item.name,
          imageUrl: item.imageUrl,
          brand: item.brand,
          color: item.color,
          size: item.size,
          rentalPrices: item.rentalPrices,
        }}
        size="md"
        variant="embedded"
        className="hc-booking-inv-card-inner"
      />

      {/* Outer Level: Bottom Actions & Booking Info */}
      <div className="hc-booking-inv-card-outer-footer">
        {subsequentBlock && (
          <span
            className="hc-micro-text error-text hc-booking-inv-card-subsequent-msg"
            data-testid={`subsequent-block-msg-${item.code}`}
          >
            อัปเดตเป็น "{BOOKING_STATUS_META[subsequentBlock.status].label}" เมื่อ{' '}
            {formatDateThaiShort(subsequentBlock.date)} แล้ว
          </span>
        )}

        <div className="hc-booking-inv-card-outer-actions">
          <div className="hc-booking-inv-card-footer-left">
            {/* Customer info (only when booked) stacked above price & dates */}
            {isBooked && booking && (
              <div className="hc-booking-inv-card-outer-info">
                <span className="small-text hc-booking-inv-card-customer-pill">
                  <i className="tiny primary-text">person</i>
                  <b className="truncate on-surface-text">
                    {booking.customerName}
                  </b>
                </span>
              </div>
            )}

            <div className="hc-booking-inv-card-meta-row">
              {renderPrice()}
              {isBooked && booking && (
                <span className="secondary-text hc-micro-text hc-booking-inv-card-date-pill">
                  <i className="tiny">date_range</i>
                  <span>
                    {formatDateThaiShort(booking.startDate)} –{' '}
                    {formatDateThaiShort(booking.endDate)}
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className="hc-booking-inv-card-footer-right">
            {isBooked && booking && (
              isReturned ? (
                <button
                  type="button"
                  className="circle primary-container no-margin hc-booking-inv-card-info-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onViewBooking) {
                      onViewBooking(booking);
                    } else {
                      onEditBooking(booking);
                    }
                  }}
                  aria-label={`ดูรายละเอียดการจอง ${item.code}`}
                  title="ดูรายละเอียดการจอง"
                >
                  <i className="small">info</i>
                </button>
              ) : (
                <button
                  type="button"
                  className="circle primary-container no-margin hc-booking-inv-card-edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditBooking(booking);
                  }}
                  aria-label={`แก้ไขการจอง ${item.code}`}
                  title="แก้ไขการจอง"
                >
                  <i className="small">edit</i>
                </button>
              )
            )}

            {renderActionRight()}
          </div>
        </div>
      </div>
    </article>
  );
};
