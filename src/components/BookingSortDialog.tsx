/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { Modal } from '../common/components/Modal';
import './BookingSortDialog.css';

export type BookingSortKey =
  | 'startDate_asc'
  | 'startDate_desc'
  | 'code_asc'
  | 'code_desc'
  | 'createdAt_desc';

export interface BookingSortOption {
  key: BookingSortKey;
  label: string;
  icon: string;
}

export const BOOKING_SORT_OPTIONS: BookingSortOption[] = [
  { key: 'startDate_asc', label: 'วันรับชุด (ใกล้สุดก่อน)', icon: 'event' },
  { key: 'startDate_desc', label: 'วันรับชุด (ไกลสุดก่อน)', icon: 'schedule' },
  { key: 'code_asc', label: 'รหัสชุด (A-Z)', icon: 'sort_by_alpha' },
  { key: 'code_desc', label: 'รหัสชุด (Z-A)', icon: 'sort_by_alpha' },
  { key: 'createdAt_desc', label: 'วันที่ทำรายการล่าสุด', icon: 'history' },
];

export interface BookingSortDialogProps {
  isOpen: boolean;
  selectedSort: BookingSortKey;
  onSelectSort: (sort: BookingSortKey) => void;
  onClose: () => void;
}

export const BookingSortDialog: React.FC<BookingSortDialogProps> = ({
  isOpen,
  selectedSort,
  onSelectSort,
  onClose,
}) => {
  const handleChoose = (key: BookingSortKey) => {
    onSelectSort(key);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      variant="floating"
      onClose={onClose}
      id="booking-sort-dialog"
      testId="booking-sort-dialog"
      overlayClassName="hc-booking-sort-dialog-overlay"
      className="hc-booking-sort-dialog"
      ariaLabel="จัดเรียงรายการจอง"
    >
      <div className="row items-center no-margin hc-booking-sort-dialog-header">
        <i className="primary-text">sort</i>
        <h6 className="bold no-margin">จัดเรียงรายการจอง</h6>
        <div className="max" />
        <button
          type="button"
          className="circle transparent no-margin hc-booking-sort-dialog-close-btn"
          onClick={onClose}
          aria-label="ปิดหน้าต่างจัดเรียง"
        >
          <i>close</i>
        </button>
      </div>

      <div
        className="vertical hc-booking-sort-dialog-options"
        role="radiogroup"
        aria-label="ตัวเลือกการจัดเรียง"
      >
        {BOOKING_SORT_OPTIONS.map((opt) => {
          const isSelected = selectedSort === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-testid={`booking-sort-option-${opt.key}`}
              className={`row items-center round no-margin hc-booking-sort-dialog-option-btn ${
                isSelected
                  ? 'primary-container bold is-selected'
                  : 'surface-container-high'
              }`}
              onClick={() => handleChoose(opt.key)}
            >
              <i className="small">{opt.icon}</i>
              <span className={`max left-align ${isSelected ? 'bold' : ''}`}>
                {opt.label}
              </span>
              {isSelected && <i>check</i>}
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
