import React, { useState, useEffect } from 'react';
import type { InventoryItem, InventoryStatus } from '../types/inventory';
import { useIsMobile } from '../hooks/useIsMobile';
import { LazyImage } from './LazyImage';

export interface InventorySheetProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  item?: InventoryItem | null;
  onClose: () => void;
  onSubmit: (data: Omit<InventoryItem, 'id'>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

interface FormState {
  code: string;
  name: string;
  brand: string;
  color: string;
  size: string;
  status: InventoryStatus;
  type: string;
  accessories: string;
  owner: string;
  imageUrl: string;
  oneDay: string;
  threeDays: string;
  fiveDays: string;
}

const DEFAULT_FORM: FormState = {
  code: '',
  name: '',
  brand: '',
  color: '',
  size: 'S',
  status: 'available',
  type: '',
  accessories: '',
  owner: '',
  imageUrl: '',
  oneDay: '',
  threeDays: '',
  fiveDays: '',
};

export const InventorySheet: React.FC<InventorySheetProps> = ({
  isOpen,
  mode,
  item,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync form data when item or mode changes
  useEffect(() => {
    if (mode === 'edit' && item) {
      setFormData({
        code: item.code || '',
        name: item.name || '',
        brand: item.brand || '',
        color: item.color || '',
        size: item.size || 'S',
        status: item.status || 'available',
        type: item.type || '',
        accessories: item.accessories || '',
        owner: item.owner || '',
        imageUrl: item.imageUrl || '',
        oneDay: item.rentalPrices?.oneDay?.toString() ?? '',
        threeDays: item.rentalPrices?.threeDays?.toString() ?? '',
        fiveDays: item.rentalPrices?.fiveDays?.toString() ?? '',
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
    setErrorMessage(null);
    setConfirmDelete(false);
  }, [mode, item, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const code = formData.code.trim();
    const name = formData.name.trim();
    const brand = formData.brand.trim();
    const color = formData.color.trim();
    const size = formData.size.trim();

    if (!code || !name || !brand || !color || !size) {
      setErrorMessage('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    const oneDay = Number(formData.oneDay) || 0;
    const threeDays = Number(formData.threeDays) || 0;
    const fiveDays = Number(formData.fiveDays) || 0;

    if (oneDay < 0 || threeDays < 0 || fiveDays < 0) {
      setErrorMessage('ราคาเช่าต้องเป็นตัวเลขที่ถูกต้อง');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        code,
        name,
        brand,
        color,
        size,
        status: formData.status,
        type: formData.type.trim() || undefined,
        accessories: formData.accessories.trim() || null,
        owner: formData.owner.trim() || null,
        imageUrl: formData.imageUrl.trim(),
        rentalPrices: {
          oneDay,
          threeDays,
          fiveDays,
        },
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !onDelete) return;
    try {
      setSubmitting(true);
      await onDelete(item.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบข้อมูล';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Responsive classes:
  // s: bottom sheet
  // m, l: right-side sheet
  const sheetClass = isMobile
    ? 'bottom active medium-padding s'
    : 'right medium active medium-padding m l';

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="overlay active"
        onClick={onClose}
        aria-hidden="true"
        style={{ zIndex: 1000 }}
      />

      <dialog
        id="inventory-sheet"
        className={sheetClass}
        open
        style={{
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          ...(isMobile
            ? {
                maxHeight: '88dvh',
                width: '100%',
                borderRadius: '1.25rem 1.25rem 0 0',
              }
            : {
                width: '32rem',
                maxWidth: '90vw',
                height: '100dvh',
              }),
        }}
      >
        {/* Sheet Header */}
        <div
          className="row items-center no-margin"
          style={{
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--surface-variant)',
            flexShrink: 0,
          }}
        >
          <div className="max">
            <h6 className="bold no-margin">
              {mode === 'edit'
                ? `แก้ไขชุด: ${formData.code || item?.code || ''}`
                : 'เพิ่มชุดใหม่'}
            </h6>
            <p className="no-margin secondary-text small-text">
              {mode === 'edit'
                ? 'แก้ไขรายละเอียดและข้อมูลราคาเช่า'
                : 'กรอกข้อมูลชุดเพื่อบันทึกลงคลัง'}
            </p>
          </div>
          <button
            type="button"
            className="circle transparent"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
          >
            <i>close</i>
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <article className="border error-container round margin-top margin-bottom">
            <div className="row items-center no-margin">
              <i className="error-text">error</i>
              <div className="max">
                <p className="no-margin error-text small-text">{errorMessage}</p>
              </div>
            </div>
          </article>
        )}

        {/* Scrollable Form Body */}
        <form
          id="inventory-form"
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingTop: '1rem',
            paddingBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Row 1: Code and Status */}
          <div className="row no-margin" style={{ gap: '12px' }}>
            <div className="field label border round max no-margin">
              <input
                id="field-code"
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder=" "
                required
              />
              <label htmlFor="field-code">รหัสสินค้า (SKU) *</label>
              <i>qr_code</i>
            </div>

            <div className="field label border round max no-margin">
              <select
                id="field-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="available">พร้อมเช่า (Available)</option>
                <option value="reserved">จองแล้ว (Reserved)</option>
                <option value="laundry">ส่งซัก (Laundry)</option>
              </select>
              <label htmlFor="field-status">สถานะ</label>
              <i>info</i>
            </div>
          </div>

          {/* Row 2: Name */}
          <div className="field label border round no-margin">
            <input
              id="field-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder=" "
              required
            />
            <label htmlFor="field-name">ชื่อสินค้า *</label>
            <i>checkroom</i>
          </div>

          {/* Row 3: Brand, Color, Size */}
          <div className="row no-margin" style={{ gap: '8px' }}>
            <div className="field label border round max no-margin">
              <input
                id="field-brand"
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder=" "
                required
              />
              <label htmlFor="field-brand">แบรนด์ *</label>
              <i>sell</i>
            </div>

            <div className="field label border round max no-margin">
              <input
                id="field-color"
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder=" "
                required
              />
              <label htmlFor="field-color">สี *</label>
              <i>palette</i>
            </div>

            <div className="field label border round max no-margin">
              <input
                id="field-size"
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                placeholder=" "
                required
              />
              <label htmlFor="field-size">ไซส์ *</label>
              <i>height</i>
            </div>
          </div>

          {/* Row 4: Rental Prices */}
          <div>
            <label className="bold small-text secondary-text">
              ราคาเช่า (บาท) *
            </label>
            <div
              className="row no-margin"
              style={{ gap: '8px', marginTop: '6px' }}
            >
              <div className="field label border round max no-margin">
                <input
                  id="field-price-1"
                  type="number"
                  name="oneDay"
                  min="0"
                  value={formData.oneDay}
                  onChange={handleChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="field-price-1">1 วัน</label>
                <i>payments</i>
              </div>

              <div className="field label border round max no-margin">
                <input
                  id="field-price-3"
                  type="number"
                  name="threeDays"
                  min="0"
                  value={formData.threeDays}
                  onChange={handleChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="field-price-3">3 วัน</label>
                <i>payments</i>
              </div>

              <div className="field label border round max no-margin">
                <input
                  id="field-price-5"
                  type="number"
                  name="fiveDays"
                  min="0"
                  value={formData.fiveDays}
                  onChange={handleChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="field-price-5">5 วัน</label>
                <i>payments</i>
              </div>
            </div>
          </div>

          {/* Row 5: Image URL & Preview */}
          <div className="field label border round no-margin">
            <input
              id="field-image-url"
              type="text"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder=" "
            />
            <label htmlFor="field-image-url">URL รูปภาพ (Image URL)</label>
            <i>image</i>
          </div>

          {formData.imageUrl && (
            <div
              className="row items-center round padding surface-container-low"
              style={{ gap: '12px' }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  flexShrink: 0,
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <LazyImage
                  src={formData.imageUrl}
                  alt={formData.name || 'ตัวอย่างรูปภาพ'}
                  containerStyle={{ width: '100%', height: '100%' }}
                />
              </div>
              <div className="max" style={{ minWidth: 0 }}>
                <span className="bold small-text">แสดงตัวอย่างรูปภาพ</span>
                <p
                  className="no-margin secondary-text micro-text"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formData.imageUrl}
                </p>
              </div>
            </div>
          )}

          {/* Row 6: Additional Optional Fields */}
          <div className="row no-margin" style={{ gap: '8px' }}>
            <div className="field label border round max no-margin">
              <input
                id="field-type"
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder=" "
              />
              <label htmlFor="field-type">หมวดหมู่ / Type</label>
              <i>category</i>
            </div>

            <div className="field label border round max no-margin">
              <input
                id="field-accessories"
                type="text"
                name="accessories"
                value={formData.accessories}
                onChange={handleChange}
                placeholder=" "
              />
              <label htmlFor="field-accessories">อุปกรณ์เสริม / Accessories</label>
              <i>auto_awesome</i>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Warning (Edit Mode) */}
        {confirmDelete && (
          <article className="border error-container round margin-top margin-bottom">
            <div className="vertical" style={{ gap: '8px' }}>
              <div className="row items-center no-margin">
                <i className="error-text">warning</i>
                <div className="max">
                  <h6 className="bold no-margin error-text small">
                    ยืนยันการลบรายการนี้?
                  </h6>
                  <p className="no-margin small-text secondary-text">
                    ข้อมูลชุด "{item?.code} - {item?.name}" จะถูกลบออกจากคลังสินค้า
                  </p>
                </div>
              </div>
              <div className="row no-margin right-align" style={{ gap: '8px' }}>
                <button
                  type="button"
                  className="border small round"
                  onClick={() => setConfirmDelete(false)}
                  disabled={submitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className="error small round"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="shape loading-indicator small" role="status" />
                  ) : (
                    <span>ยืนยันลบ</span>
                  )}
                </button>
              </div>
            </div>
          </article>
        )}

        {/* Sheet Footer Action Bar */}
        <div
          className="row items-center no-margin"
          style={{
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--surface-variant)',
            flexShrink: 0,
            gap: '8px',
          }}
        >
          {/* Delete action in Edit mode */}
          {mode === 'edit' && onDelete && !confirmDelete && (
            <button
              type="button"
              className="border round error-text"
              onClick={() => setConfirmDelete(true)}
              disabled={submitting}
              title="ลบรายการนี้"
            >
              <i>delete</i>
              <span>ลบชุด</span>
            </button>
          )}

          <div className="max" />

          {/* Cancel button */}
          <button
            type="button"
            className="border round"
            onClick={onClose}
            disabled={submitting}
          >
            ยกเลิก
          </button>

          {/* Submit button */}
          <button
            type="submit"
            form="inventory-form"
            className="primary round"
            disabled={submitting}
          >
            {submitting ? (
              <div className="shape loading-indicator small" role="status" />
            ) : mode === 'edit' ? (
              <>
                <i>save</i>
                <span>บันทึก</span>
              </>
            ) : (
              <>
                <i>add</i>
                <span>เพิ่มชุด</span>
              </>
            )}
          </button>
        </div>
      </dialog>
    </>
  );
};
