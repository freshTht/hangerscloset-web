import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  addDaysISO,
  getConflictingBookingsForItem,
  getTodayISO,
  type Booking,
  type BookingLineItem,
} from '../types/booking';
import type { Customer } from '../types/customer';
import type { InventoryItem } from '../types/inventory';
import type { NewBookingInput } from '../services/bookings';
import type { NewCustomerInput } from '../services/customers';
import { useInventory } from '../hooks/useInventory';
import { useCustomers } from '../hooks/useCustomers';
import { BookingCard } from './BookingCard';
import { CustomerPicker } from './CustomerPicker';
import { Stack } from './Stack';
import { Modal } from '../common/components/Modal';
import './BookingSheet.css';

export interface BookingSheetProps {
  isOpen: boolean;
  mode: 'add' | 'edit' | 'view';
  booking?: Booking | null;
  bookings: Booking[];
  selectedDate?: string;
  inventoryItems?: InventoryItem[];
  customers?: Customer[];
  onAddCustomer?: (customer: NewCustomerInput) => Promise<string>;
  onClose: () => void;
  onSubmit: (data: NewBookingInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onEditBooking?: (booking: Booking) => void;
}

function getItemRentalPriceForDuration(
  item: InventoryItem,
  durationDays: number
): number {
  if (!Array.isArray(item.rentalPrices) || item.rentalPrices.length === 0) {
    return 0;
  }
  const sorted = [...item.rentalPrices].sort(
    (a, b) => a.durationDays - b.durationDays
  );
  const exact = sorted.find((t) => t.durationDays === durationDays);
  if (exact) return exact.price;
  const lowerOrEqual = [...sorted]
    .reverse()
    .find((t) => t.durationDays <= durationDays);
  return (lowerOrEqual ?? sorted[0]).price;
}

function computeSuggestedPrice(
  selectedLineItems: BookingLineItem[],
  inventoryMap: Map<string, InventoryItem>,
  durationDays: number
): number {
  let total = 0;
  for (const li of selectedLineItems) {
    const inv = inventoryMap.get(li.itemId) ?? (li.itemCode ? inventoryMap.get(li.itemCode.toLowerCase()) : undefined);
    if (inv) {
      total += getItemRentalPriceForDuration(inv, durationDays);
    }
  }
  return total;
}

function getSheetTitle(mode: 'add' | 'edit' | 'view'): string {
  switch (mode) {
    case 'add':
      return 'สร้างการจองใหม่';
    case 'view':
      return 'รายละเอียดการจอง';
    case 'edit':
    default:
      return 'แก้ไขการจอง';
  }
}

export const BookingSheet: React.FC<BookingSheetProps> = ({
  isOpen,
  mode,
  booking,
  bookings,
  selectedDate: propSelectedDate,
  inventoryItems: propInventoryItems,
  customers: propCustomers,
  onAddCustomer: propOnAddCustomer,
  onClose,
  onSubmit,
  onDelete,
  onEditBooking,
}) => {
  const { items: hookInventoryItems } = useInventory();
  const { customers: hookCustomers, addCustomer: hookAddCustomer } = useCustomers();

  const inventoryItems = propInventoryItems ?? hookInventoryItems;
  const customers = propCustomers ?? hookCustomers;
  const addCustomerFn = propOnAddCustomer ?? hookAddCustomer;

  const inventoryMap = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    for (const item of inventoryItems) {
      map.set(item.id, item);
      if (item.code) {
        map.set(item.code.toLowerCase(), item);
      }
    }
    return map;
  }, [inventoryItems]);

  const todayIso = getTodayISO();

  const [contentReady, setContentReady] = useState(false);
  const [activeMode, setActiveMode] = useState<'add' | 'edit' | 'view'>(mode);
  const [startDate, setStartDate] = useState(todayIso);
  const [durationDays, setDurationDays] = useState<number>(3);
  const [endDate, setEndDate] = useState(addDaysISO(todayIso, 2));
  const [cleaningEndDate, setCleaningEndDate] = useState(addDaysISO(todayIso, 4));
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedItems, setSelectedItems] = useState<BookingLineItem[]>([]);
  const [rentalPrice, setRentalPrice] = useState<string>('0');
  const [priceManuallyEdited, setPriceManuallyEdited] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevIsOpenRef = useRef(false);
  const prevModeRef = useRef(mode);
  const prevBookingIdRef = useRef(booking?.id);

  useEffect(() => {
    if (isOpen) {
      const isFreshOpen =
        !prevIsOpenRef.current ||
        prevModeRef.current !== mode ||
        prevBookingIdRef.current !== booking?.id;

      if (isFreshOpen) {
        prevIsOpenRef.current = true;
        prevModeRef.current = mode;
        prevBookingIdRef.current = booking?.id;
        setActiveMode(mode);

        if ((mode === 'edit' || mode === 'view') && booking) {
          const bStart = booking.startDate;
          const bDur = Math.max(1, booking.durationDays || 3);
          const bEnd = booking.endDate || addDaysISO(bStart, bDur - 1);
          const bCleaning = booking.cleaningEndDate || addDaysISO(bEnd, 2);

          setStartDate(bStart);
          setDurationDays(bDur);
          setEndDate(bEnd);
          setCleaningEndDate(bCleaning);
          if (booking.customerId || booking.customerName) {
            setSelectedCustomer({
              id: booking.customerId,
              name: booking.customerName,
              phone: booking.customerPhone,
              lineId: booking.customerLineId ?? null,
              createdAt: booking.createdAt,
            });
          } else {
            setSelectedCustomer(null);
          }
          const mappedItems = booking.items.map((item) => ({
            ...item,
            conditionNote: item.conditionNote ?? null,
          }));
          setSelectedItems(mappedItems);
          setRentalPrice(String(booking.rentalPrice));
          const initialSuggested = computeSuggestedPrice(
            mappedItems,
            inventoryMap,
            bDur
          );
          setPriceManuallyEdited(
            inventoryMap.size > 0 ? booking.rentalPrice !== initialSuggested : true
          );
          setNote(booking.note ?? '');
        } else {
          const defaultStart = booking?.startDate || propSelectedDate || todayIso;
          const defaultDuration = booking?.durationDays || 3;
          const defaultEnd = booking?.endDate || addDaysISO(defaultStart, defaultDuration - 1);
          const defaultCleaning = booking?.cleaningEndDate || addDaysISO(defaultEnd, 2);

          setStartDate(defaultStart);
          setDurationDays(defaultDuration);
          setEndDate(defaultEnd);
          setCleaningEndDate(defaultCleaning);

          if (booking?.customerId) {
            setSelectedCustomer({
              id: booking.customerId,
              name: booking.customerName,
              phone: booking.customerPhone,
              lineId: booking.customerLineId ?? null,
              createdAt: booking.createdAt,
            });
          } else {
            setSelectedCustomer(null);
          }

          const initialItems = (booking?.items ?? []).map((item) => ({
            ...item,
            conditionNote: item.conditionNote ?? null,
          }));
          setSelectedItems(initialItems);

          if (initialItems.length > 0) {
            const suggested = computeSuggestedPrice(initialItems, inventoryMap, defaultDuration);
            setRentalPrice(String(suggested));
          } else {
            setRentalPrice('0');
          }
          setPriceManuallyEdited(false);
          setNote(booking?.note ?? '');
        }

        setErrorMessage(null);
        setConfirmDelete(false);
        setShowConfirmModal(false);
        setContentReady(true);
      }
      return;
    }

    if (prevIsOpenRef.current) {
      prevIsOpenRef.current = false;
    }

    const timer = window.setTimeout(() => {
      setContentReady(false);
      setErrorMessage(null);
      setConfirmDelete(false);
      setShowConfirmModal(false);
      setSubmitting(false);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [isOpen, mode, booking, propSelectedDate, inventoryMap, todayIso]);

  const suggestedPrice = useMemo(
    () => computeSuggestedPrice(selectedItems, inventoryMap, durationDays),
    [selectedItems, inventoryMap, durationDays]
  );

  useEffect(() => {
    if (!priceManuallyEdited) {
      setRentalPrice(String(suggestedPrice));
    }
  }, [suggestedPrice, priceManuallyEdited]);

  const numericRentalPrice = Number(rentalPrice);
  const isPriceValid = !isNaN(numericRentalPrice) && numericRentalPrice >= 0 && rentalPrice.trim() !== '';
  const discountAmount =
    isPriceValid && numericRentalPrice < suggestedPrice
      ? suggestedPrice - numericRentalPrice
      : 0;

  const excludeBookingId =
    (activeMode === 'edit' || activeMode === 'view') && booking ? booking.id : undefined;

  const conflictMap = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const li of selectedItems) {
      const conflicts = getConflictingBookingsForItem(
        li.itemId,
        startDate,
        cleaningEndDate,
        bookings,
        excludeBookingId
      );
      if (conflicts.length > 0) {
        map.set(li.itemId, conflicts);
      }
    }
    return map;
  }, [selectedItems, startDate, cleaningEndDate, bookings, excludeBookingId]);

  const selectedConflicts = useMemo(() => {
    return selectedItems.filter((li) => conflictMap.has(li.itemId));
  }, [selectedItems, conflictMap]);

  const handleCreateCustomerInline = async (
    input: NewCustomerInput
  ): Promise<Customer> => {
    const newId = await addCustomerFn(input);
    return {
      id: newId,
      name: input.name.trim(),
      phone: input.phone.trim(),
      lineId: input.lineId?.trim() || null,
      note: input.note?.trim() || null,
      createdAt: new Date().toISOString(),
    };
  };

  const isSubmitDisabled =
    submitting ||
    !selectedCustomer ||
    !isPriceValid ||
    selectedItems.length === 0 ||
    selectedConflicts.length > 0;

  const handleOpenConfirm = () => {
    setErrorMessage(null);
    if (!selectedCustomer) {
      setErrorMessage('กรุณาเลือกลูกค้าหรือเพิ่มลูกค้าใหม่');
      return;
    }
    if (selectedItems.length === 0) {
      setErrorMessage('กรุณาเลือกชุดที่ต้องการจองอย่างน้อย 1 ชุด');
      return;
    }
    if (!isPriceValid) {
      setErrorMessage('ราคาเช่ารวมต้องเป็นตัวเลขที่ถูกต้องและไม่ติดลบ');
      return;
    }
    if (selectedConflicts.length > 0) {
      setErrorMessage(
        `ชุด ${selectedConflicts.map((c) => c.itemCode).join(', ')} ติดจองในช่วงเวลานี้`
      );
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteSubmit = async () => {
    setErrorMessage(null);

    if (!selectedCustomer) {
      setErrorMessage('กรุณาเลือกลูกค้าหรือเพิ่มลูกค้าใหม่');
      setShowConfirmModal(false);
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerLineId: selectedCustomer.lineId ?? null,
        items: selectedItems,
        transactionDates: booking?.transactionDates ?? {
          reserved: startDate < todayIso ? startDate : todayIso,
        },
        startDate,
        endDate,
        cleaningEndDate,
        durationDays: Math.max(1, durationDays),
        rentalPrice: numericRentalPrice,
        deposit: 0,
        depositRefunded: false,
        note: note.trim() || null,
      });
      setShowConfirmModal(false);
      onClose();
    } catch (err: unknown) {
      setShowConfirmModal(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'เกิดข้อผิดพลาดในการบันทึกข้อมูลการจอง'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!booking || !onDelete) return;
    try {
      setSubmitting(true);
      await onDelete(booking.id);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบการจอง'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        visible={isOpen}
        variant="bottom-sheet"
        onClose={onClose}
        id="booking-sheet"
        testId="booking-sheet"
        overlayClassName="hc-booking-sheet-overlay"
        className="hc-booking-sheet-dialog"
        ariaLabel={getSheetTitle(activeMode)}
        dialogRef={dialogRef}
      >
        {/* Top bar */}
        <div className="row no-margin align-center hc-booking-sheet-top-bar">
          <h6 className="bold no-margin">
            {getSheetTitle(activeMode)}
          </h6>
          <div className="max" />
          <button
            ref={closeBtnRef}
            type="button"
            className="circle transparent no-margin hc-booking-sheet-close-btn"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
          >
            <i aria-hidden="true">close</i>
          </button>
        </div>

        {contentReady && (
          <>
            {errorMessage && (
              <article className="border error-container margin-bottom hc-booking-sheet-error-banner">
                <div className="row no-margin align-center">
                  <i className="error-text" aria-hidden="true">error</i>
                  <div className="max">
                    <p className="no-margin error-text small-text">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </article>
            )}

            {/* Form body containing the cards */}
            <div className="hc-booking-sheet-body">
              {/* Unified Card 1: Multi-Item Booking Card (View-Only Sub-Card Carousel & Booking Summary) */}
              <BookingCard
                booking={{
                  id: booking?.id || 'draft-booking',
                  customerId: selectedCustomer?.id ?? '',
                  customerName: selectedCustomer?.name ?? '',
                  customerPhone: selectedCustomer?.phone ?? '',
                  customerLineId: selectedCustomer?.lineId ?? null,
                  items: selectedItems,
                  transactionDates: booking?.transactionDates ?? {
                    reserved: startDate < todayIso ? startDate : todayIso,
                  },
                  startDate,
                  endDate,
                  cleaningEndDate,
                  durationDays,
                  rentalPrice: isPriceValid ? numericRentalPrice : suggestedPrice,
                  deposit: 0,
                  depositRefunded: false,
                  note: note.trim() || null,
                  createdAt: booking?.createdAt ?? todayIso,
                  updatedAt: booking?.updatedAt ?? todayIso,
                }}
                selectedDate={startDate}
                inventoryMap={inventoryMap}
                hideActions={true}
                onRemoveItem={
                  activeMode !== 'view'
                    ? (itemId) =>
                        setSelectedItems((prev) =>
                          prev.filter((item) => item.itemId !== itemId)
                        )
                    : undefined
                }
                conflictMap={conflictMap}
              />

              {/* Card 3: Customer Info (ข้อมูลลูกค้า - Editable in add/edit) */}
              <article className="border surface-container-low padding no-margin hc-booking-sheet-card">
                <Stack orientation="column" gap="small">
                  <div className="row no-margin align-center hc-booking-sheet-card-header">
                    <div className="row no-margin align-center hc-booking-sheet-card-title">
                      <i className="primary-text" aria-hidden="true">person</i>
                      <span className="bold small-text">
                        ข้อมูลลูกค้า {activeMode !== 'view' && '*'}
                      </span>
                    </div>
                  </div>

                  <CustomerPicker
                    customers={customers}
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={setSelectedCustomer}
                    onCreateCustomer={handleCreateCustomerInline}
                    disabled={activeMode === 'view'}
                  />
                </Stack>
              </article>

              {/* Card 4: Payment (การชำระเงิน - Editable in add/edit) */}
              <article className="border surface-container-low padding no-margin hc-booking-sheet-card">
                <Stack orientation="column" gap="medium">
                  <div className="row no-margin align-center justify-between wrap hc-booking-sheet-card-header">
                    <div className="row no-margin align-center hc-booking-sheet-card-title">
                      <i className="primary-text" aria-hidden="true">payments</i>
                      <span className="bold small-text">
                        การชำระเงิน {activeMode !== 'view' && '*'}
                      </span>
                    </div>
                    {activeMode !== 'view' && priceManuallyEdited && (
                      <button
                        type="button"
                        className="chip small border transparent no-margin hc-booking-sheet-btn-min-48"
                        onClick={() => {
                          setPriceManuallyEdited(false);
                          setRentalPrice(String(suggestedPrice));
                        }}
                      >
                        ใช้ราคาแนะนำ (฿{suggestedPrice.toLocaleString()})
                      </button>
                    )}
                  </div>

                  <div className="column no-margin hc-booking-sheet-pricing-wrap">
                    <div className="field label border surface no-margin">
                      <input
                        id="booking-rental-price"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={rentalPrice}
                        disabled={activeMode === 'view'}
                        onChange={(e) => {
                          setRentalPrice(e.target.value);
                          setPriceManuallyEdited(true);
                        }}
                        placeholder=" "
                        required
                      />
                      <label htmlFor="booking-rental-price">ราคาเช่ารวม (฿) *</label>
                    </div>

                    {discountAmount > 0 && (
                      <div
                        className="hc-booking-sheet-discount small-text tertiary-text bold"
                        data-testid="booking-discount-text"
                      >
                        ลดราคา {discountAmount.toLocaleString()} ฿
                      </div>
                    )}
                  </div>

                  <div className="field textarea label border no-margin">
                    <textarea
                      id="booking-note"
                      rows={3}
                      value={note}
                      disabled={activeMode === 'view'}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder=" "
                      className="hc-booking-sheet-note-input"
                    />
                    <label htmlFor="booking-note">หมายเหตุการจอง / จัดส่ง</label>
                    <i aria-hidden="true">edit_note</i>
                  </div>
                </Stack>
              </article>

              {/* Delete Confirmation (Edit mode only) */}
              {activeMode === 'edit' && confirmDelete && (
                <article className="border error-container margin-top margin-bottom hc-booking-sheet-delete-banner">
                  <div className="vertical hc-booking-sheet-delete-confirm-content">
                    <div className="row no-margin align-center">
                      <i className="error-text" aria-hidden="true">warning</i>
                      <div className="max">
                        <h6 className="bold no-margin error-text small">
                          ยืนยันการลบรายการนี้?
                        </h6>
                        <p className="no-margin small-text secondary-text">
                          ข้อมูลการจองของ &quot;{booking?.customerName}&quot; จะถูกลบออกจากระบบ
                        </p>
                      </div>
                    </div>
                    <div className="row no-margin right-align hc-booking-sheet-delete-confirm-actions">
                      <button
                        type="button"
                        className="border small round no-margin hc-booking-sheet-btn-min-48"
                        onClick={() => setConfirmDelete(false)}
                        disabled={submitting}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        className="error small round no-margin hc-booking-sheet-btn-min-48"
                        onClick={handleDelete}
                        disabled={submitting}
                        data-testid="confirm-delete-button"
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
            </div>

            {/* Footer */}
            <div className="row no-margin align-center hc-booking-sheet-footer">
              {activeMode === 'view' ? (
                <>
                  <button
                    type="button"
                    className="border round no-margin hc-booking-sheet-btn-min-48"
                    onClick={onClose}
                  >
                    ปิด
                  </button>
                  <div className="max" />
                  <button
                    type="button"
                    className="primary round no-margin hc-booking-sheet-btn-min-48"
                    onClick={() => {
                      if (onEditBooking && booking) {
                        onEditBooking(booking);
                      } else {
                        setActiveMode('edit');
                      }
                    }}
                  >
                    <i>edit</i>
                    <span>แก้ไขการจอง</span>
                  </button>
                </>
              ) : (
                <>
                  {activeMode === 'edit' && onDelete && !confirmDelete && (
                    <button
                      type="button"
                      className="border round error-text no-margin hc-booking-sheet-btn-min-48"
                      onClick={() => setConfirmDelete(true)}
                      disabled={submitting}
                      title="ลบการจองนี้"
                      data-testid="delete-booking-button"
                    >
                      <i>delete</i>
                      <span>ลบการจอง</span>
                    </button>
                  )}

                  <div className="max" />

                  <button
                    type="button"
                    className="border round no-margin hc-booking-sheet-btn-min-48"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="button"
                    className="primary round no-margin hc-booking-sheet-submit-btn hc-booking-sheet-btn-min-48"
                    disabled={isSubmitDisabled}
                    onClick={handleOpenConfirm}
                    data-testid="submit-booking-button"
                  >
                    {submitting ? (
                      <div className="shape loading-indicator small" role="status" />
                    ) : (
                      <>
                        <i>{activeMode === 'edit' ? 'save' : 'check'}</i>
                        <span>
                          {activeMode === 'edit' ? 'บันทึกการแก้ไข' : 'สร้างการจอง'}
                        </span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Compact confirmation modal dialog */}
      {showConfirmModal && (
        <Modal
          visible={showConfirmModal}
          variant="floating"
          onClose={() => !submitting && setShowConfirmModal(false)}
          closeOnEscape={!submitting}
          closeOnOverlayClick={!submitting}
          overlayClassName="hc-booking-sheet-confirm-overlay"
          className="round hc-medium-padding hc-booking-confirm-modal"
          ariaLabel={activeMode === 'edit' ? 'ยืนยันการแก้ไขการจอง' : 'ยืนยันการจอง'}
          testId="confirm-booking-dialog"
        >
          <Stack orientation="column" gap="medium">
            <Stack orientation="row" align="center" gap="small">
              <i className="primary-text" aria-hidden="true">
                {activeMode === 'edit' ? 'edit_calendar' : 'check_circle'}
              </i>
              <h6 className="bold no-margin">
                {activeMode === 'edit' ? 'ยืนยันการแก้ไขการจอง' : 'ยืนยันการจอง'}
              </h6>
            </Stack>

            <p className="no-margin small-text">
              {activeMode === 'edit'
                ? `ยืนยันการแก้ไขการจอง ${selectedItems.length} ชุด สำหรับ ${selectedCustomer?.name || 'ลูกค้า'} ยอดชำระ ฿${numericRentalPrice.toLocaleString()}?`
                : `ยืนยันการจอง ${selectedItems.length} ชุด สำหรับ ${selectedCustomer?.name || 'ลูกค้า'} ยอดชำระ ฿${numericRentalPrice.toLocaleString()}?`}
            </p>

            <Stack orientation="row" gap="small" justify="flex-end">
              <button
                type="button"
                className="border round no-margin hc-booking-sheet-btn-min-48"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                data-testid="confirm-booking-cancel"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="primary round no-margin hc-booking-sheet-btn-min-48"
                onClick={handleExecuteSubmit}
                disabled={submitting}
                data-testid="confirm-booking-submit"
              >
                {submitting ? (
                  <div className="shape loading-indicator small" role="status" />
                ) : (
                  <span>ยืนยัน</span>
                )}
              </button>
            </Stack>
          </Stack>
        </Modal>
      )}
    </>
  );
};
