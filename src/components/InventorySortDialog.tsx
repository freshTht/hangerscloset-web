import React, { useEffect } from 'react';
import {
  INVENTORY_SORT_OPTIONS,
  type InventorySortOption,
} from '../types/catalogFilter';
import { useIsMobile } from '../hooks/useIsMobile';

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
    : `medium-padding round m l ${isOpen ? 'active' : ''}`;

  const handleChoose = (option: InventorySortOption) => {
    onSelectSort(option);
    onClose();
  };

  return (
    <>
      <div
        className={`overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
        style={{ zIndex: 1000, pointerEvents: isOpen ? 'auto' : 'none' }}
      />

      <dialog
        id="inventory-sort-dialog"
        className={dialogClass.trim()}
        open={isOpen}
        aria-hidden={!isOpen}
        aria-label="จัดเรียงสินค้า"
        style={{
          zIndex: 1001,
          display: isOpen ? 'flex' : undefined,
          flexDirection: 'column',
          boxSizing: 'border-box',
          gap: '12px',
          ...(isMobile
            ? {
                width: '100%',
                maxWidth: '100vw',
                borderRadius: '20px 20px 0 0',
                padding: '16px',
                margin: 0,
              }
            : {
                width: '360px',
                maxWidth: '90vw',
                padding: '20px',
              }),
        }}
      >
        <div
          className="row items-center no-margin"
          style={{ gap: '8px' }}
        >
          <i>sort</i>
          <h6 className="bold no-margin">จัดเรียงรายการสินค้า</h6>
          <div className="max" />
          <button
            type="button"
            className="circle transparent no-margin"
            onClick={onClose}
            aria-label="ปิดหน้าต่างจัดเรียง"
            style={{
              width: '36px',
              height: '36px',
              minWidth: '36px',
              minHeight: '36px',
              padding: 0,
            }}
          >
            <i>close</i>
          </button>
        </div>

        <div
          className="vertical"
          style={{ gap: '6px' }}
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
                className={`row round no-margin ${
                  isSelected ? 'primary-container' : 'transparent border'
                }`}
                onClick={() => handleChoose(option.value)}
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '10px 14px',
                  height: 'auto',
                  minHeight: '48px',
                  gap: '10px',
                }}
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
