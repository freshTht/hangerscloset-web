import React, { useEffect } from 'react';
import {
  INVENTORY_SORT_OPTIONS,
  type InventorySortOption,
} from '../types/catalogFilter';
import { useIsMobile } from '../hooks/useIsMobile';
import './InventorySortDialog.css';

export interface InventorySortDialogProps {
  isOpen: boolean;
  sort: InventorySortOption;
  onSelectSort: (nextSort: InventorySortOption) => void;
  onClose: () => void;
}

export const InventorySortDialog: React.FC<InventorySortDialogProps> = ({
  isOpen,
  sort,
  onSelectSort,
  onClose,
}) => {
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const dialogClass = isMobile
    ? `bottom s ${isOpen ? 'active' : ''}`
    : `hc-medium-padding round m l ${isOpen ? 'active' : ''}`;

  const handleChoose = (option: InventorySortOption) => {
    onSelectSort(option);
    onClose();
  };

  return (
    <>
      <div
        className={`overlay ${isOpen ? 'active' : ''} hc-sort-dialog-overlay`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <dialog
        id="inventory-sort-dialog"
        className={`${dialogClass} hc-sort-dialog ${isMobile ? 'mobile' : ''}`.trim()}
        open={isOpen}
        aria-hidden={!isOpen}
        aria-label="จัดเรียงสินค้า"
      >
        <div className="row no-margin hc-sort-dialog-header">
          <i>sort</i>
          <h6 className="bold no-margin">จัดเรียงรายการสินค้า</h6>
          <div className="max" />
          <button
            type="button"
            className="circle transparent no-margin hc-sort-dialog-close-btn"
            onClick={onClose}
            aria-label="ปิดหน้าต่างจัดเรียง"
          >
            <i>close</i>
          </button>
        </div>

        <div
          className="vertical hc-sort-dialog-options"
          role="radiogroup"
          aria-label="ตัวเลือกการจัดเรียง"
        >
          {INVENTORY_SORT_OPTIONS.map((option) => {
            const isSelected = sort === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                data-testid={`sort-option-${option.value}`}
                className={`row round no-margin hc-sort-dialog-option-btn ${
                  isSelected ? 'primary-container' : 'transparent border'
                }`}
                onClick={() => handleChoose(option.value)}
              >
                <i>{option.icon}</i>
                <span className={`max left-align ${isSelected ? 'bold' : ''}`}>
                  {option.label}
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
