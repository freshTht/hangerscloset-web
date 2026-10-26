import React, { useState, useEffect, useRef } from 'react';
import type { InventoryItem, InventoryStatus } from '../types/inventory';
import { useIsMobile } from '../hooks/useIsMobile';
import { resizeImageFile } from '../lib/resizeImage';
import { LazyImage } from './LazyImage';

export interface InventorySheetProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  item?: InventoryItem | null;
  loading?: boolean;
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

// Must be >= the Beer CSS dialog slide transition so content isn't cleared mid-animation
const CLOSE_CLEANUP_DELAY_MS = 350;

const itemToForm = (item: InventoryItem): FormState => ({
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

export const InventorySheet: React.FC<InventorySheetProps> = ({
  isOpen,
  mode,
  item,
  loading = false,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM);
  const [contentReady, setContentReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // The dialog shell is always mounted (instant open/close). The form content is
  // initialized after open (post-paint) and cleared/unmounted once closed.
  useEffect(() => {
    if (isOpen) {
      setFormData(mode === 'edit' && item ? itemToForm(item) : DEFAULT_FORM);
      setErrorMessage(null);
      setConfirmDelete(false);
      setContentReady(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setContentReady(false);
      setFormData(DEFAULT_FORM);
      setErrorMessage(null);
      setConfirmDelete(false);
      setSubmitting(false);
    }, CLOSE_CLEANUP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen, mode, item]);

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

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await resizeImageFile(file);
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'ไม่สามารถโหลดรูปภาพได้');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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
        type: formData.type.trim(),
        accessories: formData.accessories.trim() || null,
        owner: formData.owner.trim() || null,
        imageUrl: formData.imageUrl.trim(),
        rentalPrices: { oneDay, threeDays, fiveDays },
      });
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
      setErrorMessage(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  const sheetClass = isMobile
    ? `bottom s ${isOpen ? 'active' : ''}`
    : `right medium m l ${isOpen ? 'active' : ''}`;

  const imageSize = isMobile ? 'min(100%, 240px)' : 'min(100%, 280px)';

  const renderImage = () => (
    <div
      className="round surface-container-high"
      style={{
        position: 'relative',
        width: imageSize,
        aspectRatio: '1 / 1',
        margin: '0 auto',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {formData.imageUrl ? (
        <LazyImage
          src={formData.imageUrl}
          alt={formData.name || 'รูปภาพชุด'}
          containerStyle={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
          }}
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <div
          className="center-align middle-align secondary-text"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <i className="extra">add_photo_alternate</i>
          <span className="small-text">ยังไม่มีรูปภาพ</span>
        </div>
      )}

      {/* Overlay actions */}
      <button
        type="button"
        className="small round fill no-margin"
        onClick={() => fileInputRef.current?.click()}
        style={{ position: 'absolute', left: 8, bottom: 8 }}
      >
        เปลี่ยน
      </button>
      {formData.imageUrl && (
        <button
          type="button"
          className="small circle fill no-margin"
          onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
          aria-label="ลบรูปภาพ"
          title="ลบรูปภาพ"
          style={{ position: 'absolute', right: 8, bottom: 8 }}
        >
          <i>delete</i>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFile}
        hidden
        data-testid="image-file-input"
      />
    </div>
  );

  return (
    <>
      <div
        className={`overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
        style={{ zIndex: 1000, pointerEvents: isOpen ? 'auto' : 'none' }}
      />

      <dialog
        id="inventory-sheet"
        className={sheetClass.trim()}
        open={isOpen}
        aria-hidden={!isOpen}
        style={{
          zIndex: 1001,
          display: isOpen ? 'flex' : undefined,
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          ...(isMobile
            ? {
                maxHeight: '90dvh',
                width: '100%',
                maxWidth: '100vw',
                borderRadius: '1.25rem 1.25rem 0 0',
                padding: '0.75rem 1rem 1rem 1rem',
                margin: 0,
              }
            : {
                width: '32rem',
                maxWidth: '90vw',
                height: '100dvh',
                padding: '1.25rem',
              }),
        }}
      >
        {/* Top bar: title only for Add; SKU chip for Edit; close button */}
        <div
          className="row items-center no-margin"
          style={{ paddingBottom: '0.35rem', flexShrink: 0 }}
        >
          {mode === 'add' ? (
            <h6 className="bold no-margin">เพิ่มชุดใหม่</h6>
          ) : (
            contentReady &&
            formData.code && (
              <span className="chip small surface-container-high bold no-margin">
                {formData.code}
              </span>
            )
          )}
          <div className="max" />
          <button
            type="button"
            className="circle transparent no-margin"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, padding: 0 }}
          >
            <i>close</i>
          </button>
        </div>

        {contentReady && (
          <>
            {errorMessage && (
              <article
                className="border error-container round margin-bottom"
                style={{ flexShrink: 0 }}
              >
                <div className="row items-center no-margin">
                  <i className="error-text">error</i>
                  <div className="max">
                    <p className="no-margin error-text small-text">{errorMessage}</p>
                  </div>
                </div>
              </article>
            )}

            {loading ? (
              <div
                className="vertical"
                style={{ flex: 1, gap: 12, padding: '1rem 0' }}
                aria-busy="true"
                aria-label="กำลังโหลดข้อมูลชุด"
              >
                <div
                  className="skeleton round"
                  style={{ width: imageSize, aspectRatio: '1 / 1', margin: '0 auto' }}
                />
                <div className="skeleton round" style={{ width: '100%', height: 48 }} />
                <div className="skeleton round" style={{ width: '100%', height: 48 }} />
                <div className="skeleton round" style={{ width: '100%', height: 48 }} />
              </div>
            ) : (
              <form
                id="inventory-form"
                onSubmit={handleSubmit}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  paddingTop: '0.25rem',
                  paddingBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minHeight: 0,
                }}
              >
                {renderImage()}

                <div className="grid no-margin" style={{ gap: '10px' }}>
                  <div className="s12 m6">
                    <div className="field label border round no-margin">
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
                  </div>

                  <div className="s12 m6">
                    <div className="field label border round no-margin">
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
                      <label htmlFor="field-status">สถานะ *</label>
                      <i>info</i>
                    </div>
                  </div>

                  <div className="s12">
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
                  </div>

                  <div className="s12 m6">
                    <div className="field label border round no-margin">
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
                  </div>

                  <div className="s6 m3">
                    <div className="field label border round no-margin">
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
                  </div>

                  <div className="s6 m3">
                    <div className="field label border round no-margin">
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

                  <div className="s12">
                    <label
                      className="bold small-text secondary-text"
                      style={{ display: 'block', marginBottom: 4 }}
                    >
                      ราคาเช่า (บาท) *
                    </label>
                    <div className="grid no-margin" style={{ gap: '8px' }}>
                      <div className="s4">
                        <div className="field label border round no-margin">
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
                        </div>
                      </div>
                      <div className="s4">
                        <div className="field label border round no-margin">
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
                        </div>
                      </div>
                      <div className="s4">
                        <div className="field label border round no-margin">
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
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="s12 m6">
                    <div className="field label border round no-margin">
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
                  </div>

                  <div className="s12 m6">
                    <div className="field label border round no-margin">
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
                </div>
              </form>
            )}

            {confirmDelete && (
              <article
                className="border error-container round margin-top margin-bottom"
                style={{ flexShrink: 0 }}
              >
                <div className="vertical" style={{ gap: '8px' }}>
                  <div className="row items-center no-margin">
                    <i className="error-text">warning</i>
                    <div className="max">
                      <h6 className="bold no-margin error-text small">ยืนยันการลบรายการนี้?</h6>
                      <p className="no-margin small-text secondary-text">
                        ข้อมูลชุด "{item?.code} - {item?.name}" จะถูกลบออกจากคลังสินค้า
                      </p>
                    </div>
                  </div>
                  <div className="row no-margin right-align" style={{ gap: '8px' }}>
                    <button
                      type="button"
                      className="border small round no-margin"
                      onClick={() => setConfirmDelete(false)}
                      disabled={submitting}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      className="error small round no-margin"
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

            <div
              className="row items-center no-margin"
              style={{
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--surface-variant)',
                flexShrink: 0,
                gap: '8px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {mode === 'edit' && onDelete && !confirmDelete && (
                <button
                  type="button"
                  className="border round error-text no-margin"
                  onClick={() => setConfirmDelete(true)}
                  disabled={submitting}
                  title="ลบรายการนี้"
                  style={{
                    minWidth: isMobile ? 44 : 'auto',
                    padding: isMobile ? '0 12px' : undefined,
                  }}
                >
                  <i>delete</i>
                  {!isMobile && <span>ลบชุด</span>}
                </button>
              )}

              <div className="max" />

              <button
                type="button"
                className="border round no-margin"
                onClick={onClose}
                disabled={submitting}
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                form="inventory-form"
                className="primary round no-margin"
                disabled={submitting}
                style={{ minWidth: isMobile ? 90 : 110 }}
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
          </>
        )}
      </dialog>
    </>
  );
};
