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
import { LazyImage } from './LazyImage';
import { Stack } from './Stack';

export interface BookingCardProps {
  booking: Booking;
  selectedDate?: string;
  isAllDates?: boolean;
  onEdit: (booking: Booking) => void;
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
    <article className="border round surface hc-medium-padding no-margin">
      <Stack orientation="column" gap="medium">
        {/* Top Row: Dates & Edit Button */}
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
                <span className="chip tiny surface-container no-margin">
                  Line: {booking.customerLineId}
                </span>
              )}
            </Stack>
          </Stack>

          <button
            type="button"
            className="circle transparent no-margin"
            onClick={() => onEdit(booking)}
            aria-label={`แก้ไขการจองของ ${booking.customerName}`}
            title="แก้ไขการจอง"
          >
            <i>edit</i>
          </button>
        </Stack>

        {/* Line Items List */}
        <Stack orientation="column" gap="small">
          {booking.items.map((lineItem) => {
            const isUpdating = updatingItemId === lineItem.itemId;

            return (
              <div
                key={lineItem.itemId}
                className="round surface-container-low small-padding"
              >
                <Stack
                  orientation="row"
                  align="center"
                  justify="space-between"
                  gap="small"
                  wrap
                >
                  <Stack
                    orientation="row"
                    align="center"
                    gap="small"
                    style={{ minWidth: 0, flex: 1 }}
                  >
                    <div
                      className="round surface-container-high"
                      style={{
                        width: '52px',
                        height: '52px',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {lineItem.itemImageUrl ? (
                        <LazyImage
                          src={lineItem.itemImageUrl}
                          alt={lineItem.itemName}
                          containerStyle={{
                            width: '52px',
                            height: '52px',
                          }}
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          className="center-align middle-align"
                          style={{
                            width: '52px',
                            height: '52px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <i className="secondary-text">checkroom</i>
                        </div>
                      )}
                    </div>

                    <Stack
                      orientation="column"
                      gap="tiny"
                      style={{ minWidth: 0, flex: 1 }}
                    >
                      <Stack orientation="row" align="center" gap="tiny" wrap>
                        <span className="chip tiny surface-container-high bold no-margin">
                          {lineItem.itemCode}
                        </span>
                        <span
                          className={`hc-status-badge small ${meta.chipClass}`}
                          data-testid={`status-badge-${lineItem.itemCode}`}
                        >
                          {meta.label}
                        </span>
                      </Stack>
                      <span
                        className="small-text bold"
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {lineItem.itemName}
                      </span>
                      {lineItem.conditionNote && (
                        <span className="hc-micro-text secondary-text">
                          หมายเหตุชุด: {lineItem.conditionNote}
                        </span>
                      )}
                    </Stack>
                  </Stack>

                  {meta.nextStatus && meta.nextActionLabel && (
                    <button
                      type="button"
                      className="small round border no-margin"
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
                      style={{ flexShrink: 0 }}
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
                  )}
                </Stack>
              </div>
            );
          })}
        </Stack>

        {/* Note */}
        {booking.note && (
          <div className="round surface-container small-padding">
            <Stack orientation="row" align="flex-start" gap="small">
              <i className="tiny secondary-text">notes</i>
              <span className="small-text secondary-text">{booking.note}</span>
            </Stack>
          </div>
        )}

        {/* Footer: Financials & Deposit Toggle */}
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

          {onToggleDepositRefunded && (
            <button
              type="button"
              className={`chip small no-margin ${
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
    </article>
  );
};
