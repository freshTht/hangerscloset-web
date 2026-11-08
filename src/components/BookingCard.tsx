import React, { useState } from 'react';
import {
  BOOKING_STATUS_META,
  formatDateThaiShort,
  getEffectiveBookingStatus,
  getItemStatusOnDate,
  getSubsequentStatusBlock,
  getTodayISO,
  type Booking,
  type BookingItemStatus,
} from '../types/booking';
import type { InventoryItem } from '../types/inventory';
import { InventoryCard } from '../common/components/InventoryCard';
import { StatusBadge } from './StatusBadge';
import './BookingInventoryCard.css';
import './BookingCard.css';

export interface BookingCardProps {
  booking: Booking;
  selectedDate?: string;
  isAllDates?: boolean;
  inventoryMap?: Map<string, InventoryItem>;
  onEdit?: (booking: Booking) => void;
  onView?: (booking: Booking) => void;
  onAdvanceItemStatus?: (
    bookingId: string,
    itemId: string,
    nextStatus: BookingItemStatus,
    effectiveDate?: string
  ) => Promise<void> | void;
  onAdvanceBookingStatus?: (
    bookingId: string,
    nextStatus: BookingItemStatus,
    effectiveDate?: string
  ) => Promise<void> | void;
  onToggleDepositRefunded?: (booking: Booking) => Promise<void> | void;
  hideActions?: boolean;
  onRemoveItem?: (itemId: string) => void;
  conflictMap?: Map<string, Booking[]>;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  selectedDate,
  isAllDates = false,
  inventoryMap,
  onEdit,
  onView,
  onAdvanceItemStatus,
  onAdvanceBookingStatus,
  hideActions = false,
  onRemoveItem,
  conflictMap,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const today = getTodayISO();
  const effectiveDate = isAllDates ? today : (selectedDate ?? today);
  const computedStatus = getEffectiveBookingStatus(
    booking,
    selectedDate ?? today,
    isAllDates
  );
  const isPastDate = Boolean(selectedDate && selectedDate < today && !isAllDates);
  const isTerminal = computedStatus === 'returned' || computedStatus === 'cancelled';
  const showInfoIcon = isPastDate || isTerminal;
  const meta = BOOKING_STATUS_META[computedStatus];

  const subsequentBlock =
    !hideActions && meta.nextStatus
      ? getSubsequentStatusBlock(booking, effectiveDate, meta.nextStatus)
      : null;

  const handleAdvanceStatus = async (nextStatus: BookingItemStatus) => {
    try {
      setIsUpdating(true);
      if (onAdvanceBookingStatus) {
        await onAdvanceBookingStatus(booking.id, nextStatus, effectiveDate);
      } else if (onAdvanceItemStatus) {
        for (const item of booking.items) {
          if (item.status !== 'returned') {
            await onAdvanceItemStatus(
              booking.id,
              item.itemId,
              nextStatus,
              effectiveDate
            );
          }
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const advanceAriaLabel = meta.nextActionLabel
    ? booking.items
        .map((i) => `ปรับสถานะ ${i.itemCode} เป็น ${meta.nextActionLabel}`)
        .join(' / ')
    : undefined;

  return (
    <article
      className="border medium-round no-margin hc-booking-inv-card hc-booking-card"
      data-testid={`grouped-booking-card-${booking.id}`}
    >
      {/* Inner Level: Horizontal Carousel of Sub-Cards (InventoryCard) */}
      {booking.items.length === 0 ? (
        <div className="center-align padding secondary-text small-text">
          ยังไม่ได้เลือกชุด
        </div>
      ) : (
        <div
          className={`row scroll no-wrap hc-booking-card-carousel ${
            booking.items.length > 1 ? 'is-multi' : 'is-single'
          } items-${booking.items.length}`}
          role="region"
          aria-label={`ชุดในรายการจองของ ${booking.customerName || 'ลูกค้า'}`}
        >
          {booking.items.map((lineItem) => {
            const inv =
              inventoryMap?.get(lineItem.itemId) ??
              (lineItem.itemCode
                ? inventoryMap?.get(lineItem.itemCode.toLowerCase())
                : undefined);
            const itemStatus = getItemStatusOnDate(
              booking,
              lineItem,
              effectiveDate
            );
            const itemMeta = BOOKING_STATUS_META[itemStatus];
            const conflicts = conflictMap?.get(lineItem.itemId) ?? [];
            const hasConflict = conflicts.length > 0;

            return (
              <InventoryCard
                key={lineItem.itemId}
                item={{
                  id: lineItem.itemId,
                  code: lineItem.itemCode,
                  name: lineItem.itemName,
                  imageUrl: lineItem.itemImageUrl || inv?.imageUrl,
                  brand: inv?.brand,
                  color: inv?.color,
                  size: inv?.size,
                  rentalPrices: inv?.rentalPrices,
                }}
                size="md"
                variant="embedded"
                hasConflict={hasConflict}
                className="hc-booking-inv-card-inner hc-booking-card-subcard"
                testId={`grouped-outfit-card-${lineItem.itemCode}`}
                badgeSlot={
                  booking.items.length > 1 ? (
                    <StatusBadge
                      size="small"
                      className={itemMeta.chipClass}
                      data-testid={`status-badge-${lineItem.itemCode}`}
                    >
                      {itemMeta.label}
                    </StatusBadge>
                  ) : (
                    <span
                      className="sr-only"
                      data-testid={`status-badge-${lineItem.itemCode}`}
                    >
                      {itemMeta.label}
                    </span>
                  )
                }
                headerActionSlot={
                  onRemoveItem ? (
                    <button
                      type="button"
                      className="circle tiny transparent no-margin hc-grouped-outfit-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(lineItem.itemId);
                      }}
                      aria-label={`ลบชุด ${lineItem.itemCode} ออกจากการจอง`}
                      data-testid={`remove-outfit-btn-${lineItem.itemCode}`}
                      title="ลบชุดนี้ออกจากการจอง"
                    >
                      <i className="tiny" aria-hidden="true">close</i>
                    </button>
                  ) : undefined
                }
                noteSlot={
                  hasConflict ? (
                    <span className="hc-micro-text error-text bold">
                      ติดจองช่วงเวลานี้ ({conflicts[0].customerName})
                    </span>
                  ) : undefined
                }
              />
            );
          })}
        </div>
      )}

      {/* Outer Level: Bottom Actions & Booking Info */}
      <div className="hc-booking-inv-card-outer-footer">
        {subsequentBlock && (
          <span
            className="hc-micro-text error-text hc-booking-inv-card-subsequent-msg"
            data-testid={`subsequent-block-msg-${booking.items[0]?.itemCode ?? booking.id}`}
          >
            อัปเดตเป็น &quot;{BOOKING_STATUS_META[subsequentBlock.status].label}&quot; เมื่อ{' '}
            {formatDateThaiShort(subsequentBlock.date)} แล้ว
          </span>
        )}

        <div className="hc-booking-inv-card-outer-actions">
          <div className="hc-booking-inv-card-footer-left">
            {booking.customerName && (
              <div className="hc-booking-inv-card-outer-info">
                <span className="small-text hc-booking-inv-card-customer-pill">
                  <i className="tiny primary-text" aria-hidden="true">person</i>
                  <b className="truncate on-surface-text">
                    {booking.customerName}
                  </b>
                </span>
              </div>
            )}

            <div className="hc-booking-inv-card-meta-row">
              <div className="hc-booking-inv-card-price">
                <span className="bold primary-text medium-text">
                  ฿{booking.rentalPrice.toLocaleString()}
                </span>
              </div>
              <span
                className="chip tiny surface-container-highest no-margin hc-booking-inv-card-item-count"
                data-testid={`item-count-${booking.id}`}
              >
                <i className="tiny" aria-hidden="true">checkroom</i>
                <span>{booking.items.length} ชุด</span>
              </span>
              <span className="secondary-text hc-micro-text hc-booking-inv-card-date-pill">
                <i className="tiny" aria-hidden="true">date_range</i>
                <span>
                  {formatDateThaiShort(booking.startDate)} –{' '}
                  {formatDateThaiShort(booking.endDate)}
                </span>
              </span>
            </div>
          </div>

          {!hideActions && (
            <div className="hc-booking-inv-card-footer-right">
              {showInfoIcon ? (
                <button
                  type="button"
                  className="circle primary-container no-margin hc-booking-inv-card-info-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onView) {
                      onView(booking);
                    } else if (onEdit) {
                      onEdit(booking);
                    }
                  }}
                  aria-label={`ดูรายละเอียดการจองของ ${booking.customerName}`}
                  title="ดูรายละเอียดการจอง"
                  data-testid={`booking-info-btn-${booking.id}`}
                >
                  <i className="small" aria-hidden="true">info</i>
                </button>
              ) : (
                (onEdit || onView) && (
                  <button
                    type="button"
                    className="circle primary-container no-margin hc-booking-inv-card-edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEdit) {
                        onEdit(booking);
                      } else if (onView) {
                        onView(booking);
                      }
                    }}
                    aria-label={`แก้ไขการจองของ ${booking.customerName}`}
                    title="แก้ไขการจอง"
                    data-testid={`booking-edit-btn-${booking.id}`}
                  >
                    <i className="small" aria-hidden="true">edit</i>
                  </button>
                )
              )}

              {meta && meta.nextStatus && meta.nextActionLabel && (
                <button
                  type="button"
                  className="small round border primary bold no-margin small-text hc-booking-inv-card-advance-btn"
                  disabled={isUpdating || Boolean(subsequentBlock)}
                  onClick={() => handleAdvanceStatus(meta.nextStatus!)}
                  aria-label={advanceAriaLabel}
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
                      <i aria-hidden="true">{subsequentBlock ? 'lock' : 'arrow_forward'}</i>
                      <span className="hc-booking-inv-card-advance-label">
                        {meta.nextActionLabel}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export const GroupedBookingCard = BookingCard;
