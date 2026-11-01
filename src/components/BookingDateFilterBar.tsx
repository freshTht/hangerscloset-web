import React, { useRef, useState } from 'react';
import {
  formatDateThaiShortWithYear,
} from '../lib/bookingAvailability';

export interface BookingDateFilterBarProps {
  startDate: string;
  durationDays: number;
  endDate: string;
  cleaningEndDate: string;
  onStartDateChange: (newDate: string) => void;
  onDurationChange: (newDuration: number) => void;
  onEndDateChange: (newDate: string) => void;
}

const COMMON_DURATIONS = [1, 2, 3, 4, 5, 7, 10, 14];

export const BookingDateFilterBar: React.FC<BookingDateFilterBarProps> = ({
  startDate,
  durationDays,
  endDate,
  cleaningEndDate,
  onStartDateChange,
  onDurationChange,
  onEndDateChange,
}) => {
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  // Available duration options including current duration
  const durationOptions = Array.from(
    new Set([...COMMON_DURATIONS, durationDays])
  ).sort((a, b) => a - b);

  return (
    <div
      className="surface-container-low border hc-medium-padding bottom-margin"
      data-testid="booking-date-filter-bar"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        borderRadius: '16px',
      }}
    >
      {/* 3-Column Header matching uploaded layout reference (iPhone 13 & 14 - 1) */}
      <div
        className="row no-margin"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'nowrap',
          width: '100%',
        }}
      >
        {/* Left: วันรับชุด (Pickup date) */}
        <div
          className="surface-container-high border small-padding no-margin"
          data-testid="filter-pickup-date-button"
          style={{
            flex: 1,
            minWidth: 0,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            cursor: 'pointer',
            height: 'auto',
            padding: '8px 10px',
            borderRadius: '10px',
          }}
        >
          {/* Transparent full-card native date input for 100% reliable tap/click across mobile and desktop */}
          <input
            ref={startDateInputRef}
            type="date"
            aria-label="เลือกวันรับชุด"
            value={startDate}
            onChange={(e) => {
              if (e.target.value) {
                onStartDateChange(e.target.value);
              }
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              zIndex: 2,
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              pointerEvents: 'none',
            }}
          >
            <span className="small-text secondary-text bold">วันรับชุด</span>
            <i className="tiny secondary-text">arrow_drop_down</i>
          </div>
          <div
            className="bold medium-text"
            style={{
              textAlign: 'center',
              marginTop: '4px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {formatDateThaiShortWithYear(startDate)}
          </div>
        </div>

        {/* Center: ระยะเวลา (Duration) + Connector Arrow */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '76px',
            flexShrink: 0,
          }}
        >
          <span
            className="secondary-text bold hc-micro-text"
            style={{ marginBottom: '3px' }}
          >
            ระยะเวลา
          </span>

          <button
            type="button"
            className={`surface-container-high border tiny-padding no-margin ${
              showDurationPicker ? 'primary' : ''
            }`}
            data-testid="filter-duration-button"
            onClick={() => setShowDurationPicker((prev) => !prev)}
            aria-label={`ระยะเวลา: ${durationDays} วัน คลิกเพื่อเปลี่ยน`}
            aria-expanded={showDurationPicker}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '4px 8px',
              cursor: 'pointer',
              height: 'auto',
              borderRadius: '8px',
            }}
          >
            <span className="bold small-text">{durationDays} วัน</span>
            <i className="tiny">
              {showDurationPicker ? 'arrow_drop_up' : 'arrow_drop_down'}
            </i>
          </button>

          {/* Directional arrow pointing from pickup date to return date matching layout reference */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              marginTop: '6px',
              color: 'var(--on-surface)',
            }}
            aria-hidden="true"
          >
            <svg
              width="50"
              height="14"
              viewBox="0 0 50 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'block', maxWidth: '100%' }}
            >
              <path
                d="M2 7H45M45 7L38 2.5M45 7L38 11.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Right: วันส่งคืน (Return date) */}
        <div
          className="surface-container-high border small-padding no-margin"
          data-testid="filter-return-date-button"
          style={{
            flex: 1,
            minWidth: 0,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            cursor: 'pointer',
            height: 'auto',
            padding: '8px 10px',
            borderRadius: '10px',
          }}
        >
          {/* Transparent full-card native date input for 100% reliable tap/click across mobile and desktop */}
          <input
            ref={endDateInputRef}
            type="date"
            aria-label="เลือกวันส่งคืน"
            value={endDate}
            min={startDate}
            onChange={(e) => {
              if (e.target.value) {
                onEndDateChange(e.target.value);
              }
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              zIndex: 2,
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              pointerEvents: 'none',
            }}
          >
            <span className="small-text secondary-text bold">วันส่งคืน</span>
            <i className="tiny secondary-text">arrow_drop_down</i>
          </div>
          <div
            className="bold medium-text"
            style={{
              textAlign: 'center',
              marginTop: '4px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {formatDateThaiShortWithYear(endDate)}
          </div>
        </div>
      </div>

      {/* Duration quick selector drawer */}
      {showDurationPicker && (
        <div
          className="surface border small-padding"
          data-testid="duration-picker-drawer"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '8px',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span className="small-text bold">เลือกระยะเวลาการเช่า:</span>
            <button
              type="button"
              className="circle transparent tiny no-margin"
              onClick={() => setShowDurationPicker(false)}
              aria-label="ปิดเลือกระยะเวลา"
            >
              <i>close</i>
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            {durationOptions.map((days) => (
              <button
                key={days}
                type="button"
                className={`chip small no-margin ${
                  durationDays === days ? 'fill primary' : 'border'
                }`}
                onClick={() => {
                  onDurationChange(days);
                  setShowDurationPicker(false);
                }}
              >
                {days} วัน
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Turnaround schedule info below separator */}
      <div
        className="center-align secondary-text hc-micro-text"
        style={{
          borderTop: '1px solid var(--surface-variant)',
          paddingTop: '6px',
          marginTop: '8px',
        }}
      >
        <span>พร้อมให้เช่าต่อ: </span>
        <strong className="primary-text">
          {formatDateThaiShortWithYear(cleaningEndDate)}
        </strong>
        <span> (รวมเวลาซัก 2 วัน)</span>
      </div>
    </div>
  );
};

