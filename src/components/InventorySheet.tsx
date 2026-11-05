import React, { useState, useEffect, useRef } from 'react';
import {
  normalizeItemTags,
  type InventoryItem,
  type InventoryStatus,
} from '../types/inventory';
import { useIsMobile } from '../hooks/useIsMobile';
import { useMetadataOptions } from '../hooks/useMetadataOptions';
import { resizeImageFile } from '../lib/resizeImage';
import { LazyImage } from './LazyImage';
import { OptionPicker } from './OptionPicker';
import { TagPicker } from './TagPicker';
import { Stack } from './Stack';
import { Skeleton } from './Skeleton';
import './InventorySheet.css';

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
  tags: string[];
  note: string;
  accessories: string;
  owner: string;
  imageUrl: string;
  rentalPrices: FormRentalPriceTier[];
}

export interface FormRentalPriceTier {
  durationDays: string;
  price: string;
}

const DEFAULT_RENTAL_PRICES: FormRentalPriceTier[] = [
  { durationDays: '1', price: '' },
  { durationDays: '3', price: '' },
  { durationDays: '5', price: '' },
];

const getNextTierDurationDays = (currentMaxDays: number): number => {
  switch (currentMaxDays) {
    case 0:
      return 1;
    case 1:
      return 3;
    case 3:
      return 5;
    default:
      return currentMaxDays + 2;
  }
};

const DEFAULT_FORM: FormState = {
  code: '',
  name: '',
  brand: '',
  color: '',
  size: 'S',
  status: 'available',
  tags: [],
  note: '',
  accessories: '',
  owner: '',
  imageUrl: '',
  rentalPrices: DEFAULT_RENTAL_PRICES,
};

// Must be >= the Beer CSS dialog slide transition so content isn't cleared mid-animation
const CLOSE_CLEANUP_DELAY_MS = 350;

const itemToForm = (item: InventoryItem): FormState => {
  const tags = normalizeItemTags(item.tags, item.type);

  const rentalPrices: FormRentalPriceTier[] =
    Array.isArray(item.rentalPrices) && item.rentalPrices.length > 0
      ? [...item.rentalPrices]
          .sort((a, b) => a.durationDays - b.durationDays)
          .map((tier) => ({
            durationDays: tier.durationDays.toString(),
            price: tier.price.toString(),
          }))
      : DEFAULT_RENTAL_PRICES;

  return {
    code: item.code || '',
    name: item.name || '',
    brand: item.brand || '',
    color: item.color || '',
    size: item.size || 'S',
    status: item.status || 'available',
    tags,
    note: item.note || '',
    accessories: item.accessories || '',
    owner: item.owner || '',
    imageUrl: item.imageUrl || '',
    rentalPrices,
  };
};

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
  const { brands, colors, sizes, tags, addOption } = useMetadataOptions();

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

  const handleTierChange = (
    index: number,
    field: keyof FormRentalPriceTier,
    value: string
  ) => {
    setFormData((prev) => {
      const nextPrices = [...prev.rentalPrices];
      nextPrices[index] = { ...nextPrices[index], [field]: value };
      return { ...prev, rentalPrices: nextPrices };
    });
  };

  const handleAddTier = () => {
    setFormData((prev) => {
      const existingDays = prev.rentalPrices
        .map((t) => parseInt(t.durationDays, 10))
        .filter((d) => !isNaN(d) && d > 0);
      const maxDays = existingDays.length > 0 ? Math.max(...existingDays) : 0;
      const nextDays = getNextTierDurationDays(maxDays);

      return {
        ...prev,
        rentalPrices: [
          ...prev.rentalPrices,
          { durationDays: nextDays.toString(), price: '' },
        ],
      };
    });
  };

  const handleRemoveTier = (index: number) => {
    setFormData((prev) => {
      if (prev.rentalPrices.length <= 1) return prev;
      return {
        ...prev,
        rentalPrices: prev.rentalPrices.filter((_, idx) => idx !== index),
      };
    });
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

    if (formData.rentalPrices.length === 0) {
      setErrorMessage('กรุณาระบุราคาเช่าอย่างน้อย 1 ระยะเวลา');
      return;
    }

    const seenDays = new Set<number>();
    const parsedTiers: { durationDays: number; price: number }[] = [];

    for (const tier of formData.rentalPrices) {
      const days = parseInt(tier.durationDays, 10);
      const price = parseFloat(tier.price);

      if (isNaN(days) || days <= 0) {
        setErrorMessage('ระยะเวลาเช่า (จำนวนวัน) ต้องเป็นตัวเลขมากกว่า 0');
        return;
      }
      if (seenDays.has(days)) {
        setErrorMessage(`ระยะเวลาเช่า ${days} วัน ซ้ำกัน กรุณาแก้ไข`);
        return;
      }
      seenDays.add(days);

      if (isNaN(price) || price < 0) {
        setErrorMessage('ราคาเช่าต้องเป็นตัวเลขที่ถูกต้อง');
        return;
      }
      parsedTiers.push({ durationDays: days, price });
    }

    parsedTiers.sort((a, b) => a.durationDays - b.durationDays);

    try {
      setSubmitting(true);
      await onSubmit({
        code,
        name,
        brand,
        color,
        size,
        // Status is removed from form UI for now; default to available on new, or preserve on edit
        status: mode === 'edit' && item ? item.status : 'available',
        tags: formData.tags,
        type: formData.tags[0] || undefined,
        note: formData.note.trim() || null,
        accessories: formData.accessories.trim() || null,
        owner: formData.owner.trim() || null,
        imageUrl: formData.imageUrl.trim(),
        rentalPrices: parsedTiers,
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

  const renderImage = () => (
    <div className="round surface-container-high hc-inventory-sheet-image-wrap">
      {formData.imageUrl ? (
        <LazyImage
          src={formData.imageUrl}
          alt={formData.name || 'รูปภาพชุด'}
          containerClassName="hc-inventory-sheet-lazy-image-container"
          className="hc-inventory-sheet-image"
        />
      ) : (
        <div className="center-align middle-align secondary-text hc-inventory-sheet-image-placeholder">
          <i className="extra">add_photo_alternate</i>
          <span className="small-text">ยังไม่มีรูปภาพ</span>
        </div>
      )}

      {/* Overlay actions */}
      <button
        type="button"
        className="small round fill no-margin hc-inventory-sheet-image-change-btn"
        onClick={() => fileInputRef.current?.click()}
      >
        เปลี่ยน
      </button>
      {formData.imageUrl && (
        <button
          type="button"
          className="small circle fill no-margin hc-inventory-sheet-image-delete-btn"
          onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
          aria-label="ลบรูปภาพ"
          title="ลบรูปภาพ"
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

  const renderSubmitButtonContent = () => {
    if (submitting) {
      return <div className="shape loading-indicator small" role="status" />;
    }
    if (mode === 'edit') {
      return (
        <>
          <i>save</i>
          <span>บันทึก</span>
        </>
      );
    }
    return (
      <>
        <i>add</i>
        <span>เพิ่มชุด</span>
      </>
    );
  };

  return (
    <>
      <div
        className={`overlay hc-inventory-sheet-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <dialog
        id="inventory-sheet"
        className={`${sheetClass} hc-inventory-sheet-dialog`.trim()}
        open={isOpen}
        aria-hidden={!isOpen}
      >
        {/* Top bar: title only for Add; SKU chip for Edit; close button */}
        <div className="row no-margin hc-inventory-sheet-top-bar">
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
            className="circle transparent no-margin hc-inventory-sheet-close-btn"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
          >
            <i>close</i>
          </button>
        </div>

        {contentReady && (
          <>
            {errorMessage && (
              <article className="border error-container round margin-bottom hc-inventory-sheet-error-banner">
                <div className="row no-margin">
                  <i className="error-text">error</i>
                  <div className="max">
                    <p className="no-margin error-text small-text">{errorMessage}</p>
                  </div>
                </div>
              </article>
            )}

            {loading ? (
              <div
                className="vertical hc-inventory-sheet-loading-container"
                aria-busy="true"
                aria-label="กำลังโหลดข้อมูลชุด"
              >
                <Skeleton shape="round" className="hc-inventory-sheet-skeleton-image" />
                <Skeleton shape="round" className="hc-inventory-sheet-skeleton-field" />
                <Skeleton shape="round" className="hc-inventory-sheet-skeleton-field" />
                <Skeleton shape="round" className="hc-inventory-sheet-skeleton-field" />
              </div>
            ) : (
              <form
                id="inventory-form"
                onSubmit={handleSubmit}
                className="hc-inventory-sheet-form"
              >
                {/* 1. Image Section at the VERY TOP */}
                {renderImage()}

                {/* 2. Responsive Grid for Form Fields */}
                <div className="grid no-margin hc-inventory-sheet-grid">
                  {/* SKU Code (s12) */}
                  <div className="s12">
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

                  {/* Name (s12) */}
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

                  {/* Rental Prices - Highlighted with Tertiary Colored Rounded Box */}
                  <div className="s12">
                    <Stack
                      orientation="column"
                      padding="medium"
                      gap="medium"
                      className="round tertiary-container"
                    >
                      <Stack
                        orientation="row"
                        align="center"
                        justify="space-between"
                      >
                        <Stack orientation="row" align="center" gap="small">
                          <i>payments</i>
                          <label className="bold small-text hc-inventory-sheet-inherit-color">
                            ราคาเช่า (บาท) *
                          </label>
                        </Stack>
                        <button
                          type="button"
                          className="chip transparent small border no-margin hc-inventory-sheet-inherit-color"
                          onClick={handleAddTier}
                          title="เพิ่มระยะเวลาเช่า"
                          aria-label="เพิ่มระยะเวลาเช่า"
                        >
                          <i>add</i>
                          <span>เพิ่มระยะเวลา</span>
                        </button>
                      </Stack>

                      <Stack orientation="column" gap="small">
                        {formData.rentalPrices.map((tier, index) => (
                          <Stack
                            key={index}
                            orientation="row"
                            align="center"
                            gap="small"
                          >
                            <div className="field label border surface round no-margin hc-inventory-sheet-duration-field">
                              <input
                                id={`field-duration-${index}`}
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                min="1"
                                step="1"
                                value={tier.durationDays}
                                onChange={(e) =>
                                  handleTierChange(index, 'durationDays', e.target.value)
                                }
                                placeholder=" "
                                required
                              />
                              <label htmlFor={`field-duration-${index}`}>จำนวนวัน</label>
                            </div>

                            <div className="max field label border surface round no-margin">
                              <input
                                id={`field-price-${index}`}
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                min="0"
                                step="1"
                                value={tier.price}
                                onChange={(e) =>
                                  handleTierChange(index, 'price', e.target.value)
                                }
                                placeholder=" "
                                required
                              />
                              <label htmlFor={`field-price-${index}`}>
                                {tier.durationDays ? `ราคา ${tier.durationDays} วัน (฿)` : 'ราคาเช่า (฿)'}
                              </label>
                            </div>

                            {formData.rentalPrices.length > 1 && (
                              <button
                                type="button"
                                className="circle transparent small no-margin hc-inventory-sheet-shrink-zero"
                                onClick={() => handleRemoveTier(index)}
                                title={`ลบราคาเช่า ${tier.durationDays || index + 1} วัน`}
                                aria-label={`ลบราคาเช่า ${tier.durationDays || index + 1} วัน`}
                              >
                                <i>delete</i>
                              </button>
                            )}
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  </div>

                  {/* Brand Picker (s12 m4) with add new option */}
                  <div className="s12 m4">
                    <OptionPicker
                      id="field-brand"
                      name="brand"
                      label="แบรนด์ *"
                      icon="sell"
                      value={formData.brand}
                      options={brands}
                      onChange={(val) => setFormData((prev) => ({ ...prev, brand: val }))}
                      onAddOption={(newBrand) => addOption('brands', newBrand)}
                      required
                    />
                  </div>

                  {/* Color Picker (s6 m4) with add new option */}
                  <div className="s6 m4">
                    <OptionPicker
                      id="field-color"
                      name="color"
                      label="สี *"
                      icon="palette"
                      value={formData.color}
                      options={colors}
                      onChange={(val) => setFormData((prev) => ({ ...prev, color: val }))}
                      onAddOption={(newColor) => addOption('colors', newColor)}
                      required
                    />
                  </div>

                  {/* Size Picker (s6 m4) with add new option */}
                  <div className="s6 m4">
                    <OptionPicker
                      id="field-size"
                      name="size"
                      label="ไซส์ *"
                      icon="height"
                      value={formData.size}
                      options={sizes}
                      onChange={(val) => setFormData((prev) => ({ ...prev, size: val }))}
                      onAddOption={(newSize) => addOption('sizes', newSize)}
                      required
                    />
                  </div>

                  {/* Accessories (s12 m6) */}
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
                      <label htmlFor="field-accessories">เครื่องประดับ</label>
                      <i>auto_awesome</i>
                    </div>
                  </div>

                  {/* Owner (s12 m6) */}
                  <div className="s12 m6">
                    <div className="field label border round no-margin">
                      <input
                        id="field-owner"
                        type="text"
                        name="owner"
                        value={formData.owner}
                        onChange={handleChange}
                        placeholder=" "
                      />
                      <label htmlFor="field-owner">เจ้าของ / ฝากเช่า (Owner)</label>
                      <i>person</i>
                    </div>
                  </div>

                  {/* Tags Multi-Picker (s12) */}
                  <div className="s12">
                    <TagPicker
                      id="field-tags"
                      selectedTags={formData.tags}
                      availableTags={tags}
                      onChange={(newTags) => setFormData((prev) => ({ ...prev, tags: newTags }))}
                      onAddTag={(newTag) => addOption('tags', newTag)}
                    />
                  </div>

                  {/* Note Field - Multilined & optimized for typing longer text (s12, Below Tags) */}
                  <div className="s12">
                    <div className="field textarea label border round no-margin">
                      <textarea
                        id="field-note"
                        name="note"
                        rows={3}
                        value={formData.note}
                        onChange={handleChange}
                        placeholder=" "
                        className="hc-inventory-sheet-note-input"
                      />
                      <label htmlFor="field-note">โน๊ต</label>
                      <i>edit_note</i>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {confirmDelete && (
              <article className="border error-container round margin-top margin-bottom hc-inventory-sheet-confirm-delete-box">
                <div className="vertical hc-inventory-sheet-confirm-delete-content">
                  <div className="row no-margin">
                    <i className="error-text">warning</i>
                    <div className="max">
                      <h6 className="bold no-margin error-text small">ยืนยันการลบรายการนี้?</h6>
                      <p className="no-margin small-text secondary-text">
                        ข้อมูลชุด "{item?.code} - {item?.name}" จะถูกลบออกจากคลังสินค้า
                      </p>
                    </div>
                  </div>
                  <div className="row no-margin right-align hc-inventory-sheet-confirm-delete-actions">
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

            <div className="row no-margin hc-inventory-sheet-footer">
              {mode === 'edit' && onDelete && !confirmDelete && (
                <button
                  type="button"
                  className="border round error-text no-margin hc-inventory-sheet-delete-trigger-btn"
                  onClick={() => setConfirmDelete(true)}
                  disabled={submitting}
                  title="ลบรายการนี้"
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
                className="primary round no-margin hc-inventory-sheet-submit-btn"
                disabled={submitting}
              >
                {renderSubmitButtonContent()}
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
};
