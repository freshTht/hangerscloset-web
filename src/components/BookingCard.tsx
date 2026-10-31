import React, { useState } from 'react';
import {
  BOOKING_STATUS_META,
  formatDateThaiShort,
  type Booking,
  type BookingItemStatus,
} from '../types/booking';
import { LazyImage } from './LazyImage';
import { Stack } from './Stack';

export interface BookingCardProps {
  booking: Booking;
  onEdit: (booking: Booking) => void;
  onAdvanceItemStatus: (
    bookingId: string,
    itemId: string,
    nextStatus: BookingItemStatus
  ) => Promise<void> | void;
  onToggleDepositRefunded?: (booking: Booking) => Promise<void> | void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onEdit,
  onAdvanceItemStatus,
  onToggleDepositRefunded,
}) => {
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const handleAdvanceStatus = async (
    itemId: string,
    nextStatus: BookingItemStatus
  ) => {
    try {
      setUpdatingItemId(itemId);
      await onAdvanceItemStatus(booking.id, itemId, nextStatus);
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <article className="border round surface medium-padding no-margin">
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
                <span>พร้อมเช่าต่อหลัง {formatDateThaiShort(booking.cleaningEndDate)}</span>
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
            const meta = BOOKING_STATUS_META[lineItem.status];
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
                          className={`status-badge small ${meta.chipClass}`}
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
                        <span className="micro-text secondary-text">
                          หมายเหตุชุด: {lineItem.conditionNote}
                        </span>
                      )}
                    </Stack>
                  </Stack>

                  {meta.nextStatus && meta.nextActionLabel && (
                    <button
                      type="button"
                      className="small round border no-margin"
                      disabled={isUpdating}
                      onClick={() =>
                        handleAdvanceStatus(lineItem.itemId, meta.nextStatus!)
                      }
                      aria-label={`ปรับสถานะ ${lineItem.itemCode} เป็น ${meta.nextActionLabel}`}
                      style={{ flexShrink: 0 }}
                    >
                      {isUpdating ? (
                        <div
                          className="shape loading-indicator tiny"
                          role="status"
                        />
                      ) : (
                        <>
                          <i>arrow_forward</i>
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
          <div className="round surface-container-low small-padding">
            <Stack orientation="row" align="flex-start" gap="small">
              <i className="small secondary-text">notes</i>
              <p className="small-text secondary-text no-margin">
                {booking.note}
              </p>
            </Stack>
          </div>
        )}

        {/* Footer: Pricing & Deposit */}
        <Stack
          orientation="row"
          align="center"
          justify="space-between"
          gap="small"
          wrap
          style={{
            paddingTop: '8px',
            borderTop: '1px solid var(--surface-variant)',
          }}
        >
          <Stack orientation="row" align="center" gap="medium" wrap>
            <span className="small-text">
              ค่าเช่ารวม:{' '}
              <strong className="primary-text">
                ฿{booking.rentalPrice.toLocaleString()}
              </strong>
            </span>
            <span className="small-text secondary-text">
              มัดจำ: <strong>฿{booking.deposit.toLocaleString()}</strong>
            </span>
          </Stack>

          {booking.deposit > 0 && (
            <button
              type="button"
              className={`chip small no-margin ${
                booking.depositRefunded
                  ? 'status-badge-available'
                  : 'surface-container-high'
              }`}
              onClick={() => onToggleDepositRefunded?.(booking)}
              title="คลิกเพื่อสลับสถานะคืนมัดจำ"
            >
              <i>
                {booking.depositRefunded ? 'check_circle' : 'pending'}
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
