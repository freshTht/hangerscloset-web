/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useRef } from 'react';
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Focus restoration on close
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      // Focus the close button or first interactive element when opened
      const timer = setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen]);

  // Focus trap & Escape handler inside dialog
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleChoose = (key: BookingSortKey) => {
    onSelectSort(key);
    onClose();
  };

  return (
    <>
      <div
        className={`overlay ${isOpen ? 'active' : ''} hc-booking-sort-dialog-overlay`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <dialog
        ref={dialogRef}
        id="booking-sort-dialog"
        className={`hc-booking-sort-dialog ${isOpen ? 'active' : ''}`.trim()}
        open={isOpen}
        aria-modal="true"
        aria-hidden={!isOpen}
        aria-label="จัดเรียงรายการจอง"
        data-testid="booking-sort-dialog"
      >
        <div className="row items-center no-margin hc-booking-sort-dialog-header">
          <i className="primary-text">sort</i>
          <h6 className="bold no-margin">จัดเรียงรายการจอง</h6>
          <div className="max" />
          <button
            ref={closeBtnRef}
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
      </dialog>
    </>
  );
};
