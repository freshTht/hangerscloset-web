/* eslint-disable react-refresh/only-export-components */
import React, { useMemo } from 'react';
import { type BookingItemStatus } from '../types/booking';
import {
  type BookingSortKey,
  BOOKING_SORT_OPTIONS as SORT_OPTIONS,
} from './BookingSortDialog';
import { Modal } from '../common/components/Modal';
import './BookingFilterSheet.css';

export type { BookingSortKey };
export { SORT_OPTIONS };

export type BookingFilterTab = 'all' | 'active' | 'available' | BookingItemStatus;

export const FILTER_TABS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'available', label: 'ว่าง (พร้อมเช่า)' },
  { id: 'reserved', label: 'จองแล้ว' },
  { id: 'pending_delivery', label: 'รอส่งมอบ' },
  { id: 'delivered', label: 'ส่งมอบแล้ว' },
  { id: 'pending_return', label: 'รอรับคืน' },
  { id: 'in_laundry', label: 'ส่งซัก' },
  { id: 'returned', label: 'รับคืนเสร็จสิ้น' },
] as const;

function getBookingFilterIcon(id: BookingFilterTab): string {
  switch (id) {
    case 'all':
    case 'active':
      return 'select_all';
    case 'available':
      return 'check_circle';
    case 'reserved':
      return 'schedule';
    case 'pending_delivery':
      return 'local_shipping';
    case 'delivered':
      return 'checkroom';
    case 'pending_return':
      return 'assignment_return';
    case 'in_laundry':
      return 'local_laundry_service';
    case 'returned':
      return 'done_all';
    default:
      return 'filter_list';
  }
}

export interface BookingFilterSheetProps {
  isOpen: boolean;
  selectedFilters?: BookingFilterTab[];
  selectedFilter?: BookingFilterTab | BookingFilterTab[];
  tabCounts: Record<BookingFilterTab, number>;
  selectedSort?: BookingSortKey;
  onSelectFilter: (filter: BookingFilterTab[]) => void;
  onSelectSort?: (sort: BookingSortKey) => void;
  onClose: () => void;
}

export const BookingFilterSheet: React.FC<BookingFilterSheetProps> = ({
  isOpen,
  selectedFilters,
  selectedFilter,
  tabCounts,
  onSelectFilter,
  onClose,
}) => {
  const selectedList = useMemo<BookingFilterTab[]>(() => {
    if (selectedFilters && selectedFilters.length > 0) return selectedFilters;
    if (Array.isArray(selectedFilter)) return selectedFilter;
    if (selectedFilter) return [selectedFilter === 'active' ? 'all' : selectedFilter];
    return ['all'];
  }, [selectedFilters, selectedFilter]);

  const isAllSelected =
    selectedList.includes('all') ||
    selectedList.includes('active') ||
    selectedList.length === 0;

  const INDIVIDUAL_STATUS_IDS: BookingFilterTab[] = [
    'available',
    'reserved',
    'pending_delivery',
    'delivered',
    'pending_return',
    'in_laundry',
    'returned',
  ];

  const handleToggleStatus = (id: BookingFilterTab) => {
    if (id === 'all' || id === 'active') {
      onSelectFilter(['all']);
      return;
    }

    const currentIndividual = isAllSelected
      ? []
      : selectedList.filter((s) => s !== 'all' && s !== 'active');

    let next: BookingFilterTab[];
    if (currentIndividual.includes(id)) {
      next = currentIndividual.filter((s) => s !== id);
      if (next.length === 0) {
        next = ['all'];
      }
    } else {
      next = [...currentIndividual, id];
      const allSelected = INDIVIDUAL_STATUS_IDS.every((s) => next.includes(s));
      if (allSelected) {
        next = ['all'];
      }
    }

    onSelectFilter(next);
  };

  const isCustomized = !isAllSelected;

  return (
    <Modal
      visible={isOpen}
      variant="floating"
      onClose={onClose}
      id="booking-filter-sheet"
      testId="booking-filter-sheet"
      overlayClassName="hc-booking-filter-sheet-overlay"
      className="hc-booking-filter-sheet-dialog"
      ariaLabel="ตัวกรองสถานะการจอง"
    >
      {/* Header */}
        <div className="row items-center no-margin hc-booking-filter-sheet-header">
          <i className="primary-text">tune</i>
          <h6 className="bold no-margin">ตัวกรองสถานะ</h6>
          <div className="max" />
          <button
            type="button"
            className="circle transparent no-margin hc-booking-filter-sheet-close-btn"
            onClick={onClose}
            aria-label="ปิดตัวกรอง"
          >
            <i>close</i>
          </button>
        </div>

        {/* Status Picker (2-Column Grid) */}
        <div className="hc-booking-filter-sheet-section">
          <div className="small-text secondary-text bold hc-booking-filter-sheet-section-title">
            สถานะการจอง
          </div>

          <div
            role="group"
            aria-label="ตัวกรองสถานะการจอง"
            className="hc-booking-filter-sheet-grid"
          >
            {FILTER_TABS.map((tab) => {
              const isSelected =
                tab.id === 'all'
                  ? isAllSelected
                  : !isAllSelected && selectedList.includes(tab.id);
              const count =
                (tab.id === 'all'
                  ? (tabCounts.all ?? tabCounts.active)
                  : tabCounts[tab.id]) ?? 0;
              const icon = getBookingFilterIcon(tab.id);

              return (
                <button
                  key={tab.id}
                  role="checkbox"
                  aria-checked={isSelected}
                  type="button"
                  className={`row items-center no-margin hc-booking-filter-sheet-tab-btn ${
                    isSelected
                      ? 'primary-container bold is-selected'
                      : 'surface-container-high'
                  }`}
                  onClick={() => handleToggleStatus(tab.id)}
                >
                  <div className="hc-booking-filter-sheet-tab-label-wrap">
                    <i
                      className={`small hc-booking-filter-sheet-checkbox-icon ${
                        isSelected ? 'primary-text' : 'secondary-text'
                      }`}
                    >
                      {isSelected ? 'check_box' : 'check_box_outline_blank'}
                    </i>
                    <i
                      className={`small hc-booking-filter-sheet-tab-icon ${
                        isSelected ? 'primary-text' : 'secondary-text'
                      }`}
                    >
                      {icon}
                    </i>
                    <span
                      className="small-text hc-booking-filter-sheet-tab-label"
                      title={tab.label}
                    >
                      {tab.label}
                    </span>
                  </div>

                  <span
                    className={`hc-micro-text hc-booking-filter-sheet-tab-count ${
                      isSelected ? 'is-selected' : ''
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="row items-center no-margin hc-booking-filter-sheet-footer">
          <button
            type="button"
            className="transparent secondary-text small-text no-margin hc-booking-filter-sheet-reset-btn"
            onClick={() => {
              onSelectFilter(['all']);
            }}
            disabled={!isCustomized}
          >
            <i className="small">restart_alt</i>
            <span>รีเซ็ต</span>
          </button>

          <div className="max" />

          <button
            type="button"
            className="primary round no-margin bold hc-booking-filter-sheet-apply-btn"
            onClick={onClose}
          >
            <span>ดูผลลัพธ์</span>
          </button>
        </div>
      </Modal>
    );
  };
