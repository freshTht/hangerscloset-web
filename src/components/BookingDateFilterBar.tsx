import React, { useState, useRef } from 'react';
import { formatDateThaiShortWithYear } from '../types/booking';
import './BookingDateFilterBar.css';

export interface BookingDateFilterBarProps {
  startDate: string;
  endDate: string;
  durationDays: number;
  cleaningEndDate: string;
  onStartDateChange: (newDate: string) => void;
  onEndDateChange: (newDate: string) => void;
  onDurationChange: (days: number) => void;
  durationOptions?: number[];
  className?: string;
}

export const BookingDateFilterBar: React.FC<BookingDateFilterBarProps> = ({
  startDate,
  endDate,
  durationDays,
  cleaningEndDate,
  onStartDateChange,
  onEndDateChange,
  onDurationChange,
  durationOptions = [1, 2, 3, 5, 7],
  className = '',
}) => {
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`round surface-container-low border small-padding ${className}`.trim()}
      data-testid="booking-date-filter-bar"
    >
      {/* Horizontal Booking Range Selector matching rental application specifications */}
      <div className="row no-margin align-center no-space">
        {/* Left: วันรับชุด (Pickup date) */}
        <div
          className="surface-container-high border small-padding no-margin hc-date-filter-card"
          data-testid="filter-start-date-button"
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
            className="hc-date-filter-native-input"
          />
          <div className="hc-date-filter-header-row">
            <span className="small-text secondary-text bold">วันรับชุด</span>
            <i className="tiny secondary-text">arrow_drop_down</i>
          </div>
          <div className="bold medium-text hc-date-filter-value">
            {formatDateThaiShortWithYear(startDate)}
          </div>
        </div>

        {/* Center: ระยะเวลา (Duration) + Connector Arrow */}
        <div className="hc-date-filter-center">
          <span className="secondary-text bold hc-micro-text hc-date-filter-duration-label">
            ระยะเวลา
          </span>

          <button
            type="button"
            className={`surface-container-high border tiny-padding no-margin hc-date-filter-duration-btn ${
              showDurationPicker ? 'primary' : ''
            }`.trim()}
            data-testid="filter-duration-button"
            onClick={() => setShowDurationPicker((prev) => !prev)}
            aria-label={`ระยะเวลา: ${durationDays} วัน คลิกเพื่อเปลี่ยน`}
            aria-expanded={showDurationPicker}
          >
            <span className="bold small-text">{durationDays} วัน</span>
            <i className="tiny">
              {showDurationPicker ? 'arrow_drop_up' : 'arrow_drop_down'}
            </i>
          </button>

          {/* Directional arrow pointing from pickup date to return date matching layout reference */}
          <div className="hc-date-filter-arrow-wrap" aria-hidden="true">
            <svg
              width="50"
              height="14"
              viewBox="0 0 50 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="hc-date-filter-arrow-svg"
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
          className="surface-container-high border small-padding no-margin hc-date-filter-card"
          data-testid="filter-return-date-button"
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
            className="hc-date-filter-native-input"
          />
          <div className="hc-date-filter-header-row">
            <span className="small-text secondary-text bold">วันส่งคืน</span>
            <i className="tiny secondary-text">arrow_drop_down</i>
          </div>
          <div className="bold medium-text hc-date-filter-value">
            {formatDateThaiShortWithYear(endDate)}
          </div>
        </div>
      </div>

      {/* Duration quick selector drawer */}
      {showDurationPicker && (
        <div
          className="surface border small-padding hc-date-filter-drawer"
          data-testid="duration-picker-drawer"
        >
          <div className="hc-date-filter-drawer-header">
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
          <div className="hc-date-filter-drawer-chips">
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
      <div className="center-align secondary-text hc-micro-text hc-date-filter-turnaround">
        <span>พร้อมให้เช่าต่อ: </span>
        <strong className="primary-text">
          {formatDateThaiShortWithYear(cleaningEndDate)}
        </strong>
        <span> (รวมเวลาซัก 2 วัน)</span>
      </div>
    </div>
  );
};
