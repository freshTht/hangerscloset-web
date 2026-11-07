import React, { useState } from 'react';
import {
  BOOKING_STATUS_META,
  formatDateThaiShort,
  getEffectiveBookingStatus,
  getSubsequentStatusBlock,
  getTodayISO,
  type Booking,
  type BookingItemStatus,
} from '../types/booking';
import { InventoryCard } from '../common/components/InventoryCard';
import { Stack } from './Stack';
import { StatusBadge } from './StatusBadge';
import './BookingCard.css';

export interface BookingCardProps {
  booking: Booking;
  selectedDate?: string;
  isAllDates?: boolean;
  onEdit: (booking: Booking) => void;
  onView?: (booking: Booking) => void;
  onAdvanceItemStatus: (
    bookingId: string,
    itemId: string,
    nextStatus: BookingItemStatus,
    effectiveDate?: string
  ) => Promise<void> | void;
  onToggleDepositRefunded?: (booking: Booking) => Promise<void> | void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  selectedDate,
  isAllDates = false,
  onEdit,
  onView,
  onAdvanceItemStatus,
  onToggleDepositRefunded,
}) => {
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const today = getTodayISO();
  const effectiveDate = isAllDates ? today : (selectedDate ?? today);
  const computedStatus = getEffectiveBookingStatus(
    booking,
    selectedDate ?? today,
    isAllDates
  );
  const meta = BOOKING_STATUS_META[computedStatus];
  const subsequentBlock = meta.nextStatus
    ? getSubsequentStatusBlock(booking, effectiveDate, meta.nextStatus)
    : null;

  const handleAdvanceStatus = async (
    itemId: string,
    nextStatus: BookingItemStatus
  ) => {
    try {
      setUpdatingItemId(itemId);
      await onAdvanceItemStatus(booking.id, itemId, nextStatus, effectiveDate);
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <article className="border medium-round no-margin hc-booking-card">
      {/* Outer Level Header: Dates, Customer & Edit Button */}
      <div className="hc-booking-card-outer-header">
        <Stack
          orientation="row"
          align="flex-start"
          justify="space-between"
          gap="small"
          wrap
        >
          <Stack orientation="column" gap="tiny">
            <Stack orientation="row" align="center" gap="small" wrap>
              <span className="chip small primary-container bold no-margin">
                <i>date_range</i>
                <span>
                  {formatDateThaiShort(booking.startDate)} –{' '}
                  {formatDateThaiShort(booking.endDate)} ({booking.durationDays}{' '}
                  วัน)
                </span>
              </span>
              <span
                className="chip small surface-container-high no-margin"
                title={`เผื่อซักถึง ${booking.cleaningEndDate}`}
              >
                <i>local_laundry_service</i>
                <span>
                  พร้อมเช่าต่อหลัง {formatDateThaiShort(booking.cleaningEndDate)}
                </span>
              </span>
            </Stack>

            <Stack orientation="row" align="center" gap="small" wrap>
              <i className="small primary-text">person</i>
              <span className="bold medium-text">{booking.customerName}</span>
              <span className="small-text secondary-text">
                {booking.customerPhone}
              </span>
              {booking.customerLineId && (
                <span className="chip tiny surface-container-high no-margin">
                  Line: {booking.customerLineId}
                </span>
              )}
            </Stack>
          </Stack>
        </Stack>
      </div>

      {/* Inner Level: Inventory Items List */}
      <Stack orientation="column" gap="small">
        {booking.items.map((lineItem) => {
          const isUpdating = updatingItemId === lineItem.itemId;

          return (
            <InventoryCard
              key={lineItem.itemId}
              item={{
                id: lineItem.itemId,
                code: lineItem.itemCode,
                name: lineItem.itemName,
                imageUrl: lineItem.itemImageUrl,
                conditionNote: lineItem.conditionNote,
              }}
              size="md"
              variant="embedded"
              className="hc-booking-card-inner-item"
              badgeSlot={
                <StatusBadge
                  size="small"
                  className={meta.chipClass}
                  data-testid={`status-badge-${lineItem.itemCode}`}
                >
                  {meta.label}
                </StatusBadge>
              }
              trailingActionSlot={
                meta.nextStatus && meta.nextActionLabel ? (
                  <button
                    type="button"
                    className="small round border primary no-margin hc-booking-card-action-btn"
                    disabled={isUpdating || Boolean(subsequentBlock)}
                    onClick={() =>
                      handleAdvanceStatus(lineItem.itemId, meta.nextStatus!)
                    }
                    aria-label={`ปรับสถานะ ${lineItem.itemCode} เป็น ${meta.nextActionLabel}`}
                    title={
                      subsequentBlock
                        ? `ไม่สามารถเปลี่ยนสถานะในวันนี้ได้ เนื่องจากวันที่ ${formatDateThaiShort(subsequentBlock.date)} ได้อัปเดตเป็น "${BOOKING_STATUS_META[subsequentBlock.status].label}" แล้ว`
                        : undefined
                    }
                  >
                    {isUpdating ? (
                      <div
                        className="shape loading-indicator tiny"
                        role="status"
                      />
                    ) : (
                      <>
                        <i>{subsequentBlock ? 'lock' : 'arrow_forward'}</i>
                        <span>{meta.nextActionLabel}</span>
                      </>
                    )}
                  </button>
                ) : undefined
              }
            />
          );
        })}
      </Stack>

      {/* Note */}
      {booking.note && (
        <div className="round surface-container-high small-padding">
          <Stack orientation="row" align="flex-start" gap="small">
            <i className="tiny secondary-text">sticky_note_2</i>
            <span className="small-text secondary-text">{booking.note}</span>
          </Stack>
        </div>
      )}

      {/* Outer Footer: Financials & Deposit Toggle */}
      <div className="hc-booking-card-outer-footer">
        <Stack
          orientation="row"
          align="center"
          justify="space-between"
          gap="small"
          wrap
        >
          <Stack orientation="row" align="center" gap="medium" wrap>
            <span className="small-text">
              ค่าเช่า:{' '}
              <b className="primary-text">
                ฿{booking.rentalPrice.toLocaleString()}
              </b>
            </span>
            <span className="small-text">
              มัดจำ: <b>฿{booking.deposit.toLocaleString()}</b>
            </span>
          </Stack>

          <Stack orientation="row" align="center" gap="small">
            {computedStatus === 'returned' ? (
              <button
                type="button"
                className="circle primary-container no-margin hc-booking-card-info-btn"
                onClick={() => (onView ? onView(booking) : onEdit(booking))}
                aria-label={`ดูรายละเอียดการจองของ ${booking.customerName}`}
                title="ดูรายละเอียดการจอง"
              >
                <i>info</i>
              </button>
            ) : (
              <button
                type="button"
                className="circle primary-container no-margin hc-booking-card-edit-btn"
                onClick={() => onEdit(booking)}
                aria-label={`แก้ไขการจองของ ${booking.customerName}`}
                title="แก้ไขการจอง"
              >
                <i>edit</i>
              </button>
            )}

            {onToggleDepositRefunded && (
              <button
                type="button"
                className={`chip small no-margin hc-booking-card-deposit-btn ${
                  booking.depositRefunded
                    ? 'hc-status-badge-available'
                    : 'surface-container-high'
                }`}
                onClick={() => onToggleDepositRefunded(booking)}
                aria-label={
                  booking.depositRefunded
                    ? 'คืนเงินมัดจำแล้ว'
                    : 'ทำเครื่องหมายว่าคืนมัดจำแล้ว'
                }
              >
                <i>
                  {booking.depositRefunded
                    ? 'check_circle'
                    : 'radio_button_unchecked'}
                </i>
                <span>
                  {booking.depositRefunded ? 'คืนมัดจำแล้ว' : 'ยังไม่คืนมัดจำ'}
                </span>
              </button>
            )}
          </Stack>
        </Stack>
      </div>
    </article>
  );
};
