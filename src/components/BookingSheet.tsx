import React, { useState, useEffect, useMemo } from 'react';
import {
  BOOKING_STATUS_META,
  BOOKING_STATUS_ORDER,
  addDaysISO,
  diffDaysInclusiveISO,
  getConflictingBookingsForItem,
  getTodayISO,
  type Booking,
  type BookingItemStatus,
  type BookingLineItem,
} from '../types/booking';
import type { Customer } from '../types/customer';
import type { InventoryItem } from '../types/inventory';
import type { NewBookingInput } from '../services/bookings';
import type { NewCustomerInput } from '../services/customers';
import { useIsMobile } from '../hooks/useIsMobile';
import { useInventory } from '../hooks/useInventory';
import { useCustomers } from '../hooks/useCustomers';
import { CustomerPicker } from './CustomerPicker';
import { LazyImage } from './LazyImage';
import { Stack } from './Stack';

export interface BookingSheetProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  booking?: Booking | null;
  bookings: Booking[];
  inventoryItems?: InventoryItem[];
  customers?: Customer[];
  onAddCustomer?: (customer: NewCustomerInput) => Promise<string>;
  onClose: () => void;
  onSubmit: (data: NewBookingInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const CLOSE_CLEANUP_DELAY_MS = 350;

function computeSuggestedPrice(
  selectedLineItems: BookingLineItem[],
  inventoryMap: Map<string, InventoryItem>,
  durationDays: number
): number {
  let total = 0;
  for (const li of selectedLineItems) {
    const inv = inventoryMap.get(li.itemId);
    if (!inv || !Array.isArray(inv.rentalPrices) || inv.rentalPrices.length === 0) {
      continue;
    }
    const sorted = [...inv.rentalPrices].sort(
      (a, b) => a.durationDays - b.durationDays
    );
    const exact = sorted.find((t) => t.durationDays === durationDays);
    if (exact) {
      total += exact.price;
    } else {
      const lowerOrEqual = [...sorted]
        .reverse()
        .find((t) => t.durationDays <= durationDays);
      total += (lowerOrEqual ?? sorted[0]).price;
    }
  }
  return total;
}

export const BookingSheet: React.FC<BookingSheetProps> = ({
  isOpen,
  mode,
  booking,
  bookings,
  inventoryItems: propInventoryItems,
  customers: propCustomers,
  onAddCustomer: propOnAddCustomer,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const isMobile = useIsMobile();
  const { items: hookInventoryItems } = useInventory();
  const { customers: hookCustomers, addCustomer: hookAddCustomer } = useCustomers();

  const inventoryItems = propInventoryItems ?? hookInventoryItems;
  const customers = propCustomers ?? hookCustomers;
  const addCustomerFn = propOnAddCustomer ?? hookAddCustomer;

  const inventoryMap = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    for (const item of inventoryItems) {
      map.set(item.id, item);
    }
    return map;
  }, [inventoryItems]);

  const todayIso = getTodayISO();

  const [contentReady, setContentReady] = useState(false);
  const [startDate, setStartDate] = useState(todayIso);
  const [durationDays, setDurationDays] = useState<number>(3);
  const [endDate, setEndDate] = useState(addDaysISO(todayIso, 2));
  const [cleaningEndDate, setCleaningEndDate] = useState(
    addDaysISO(todayIso, 4)
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [selectedItems, setSelectedItems] = useState<BookingLineItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [rentalPrice, setRentalPrice] = useState<string>('0');
  const [priceManuallyEdited, setPriceManuallyEdited] = useState(false);
  const [deposit, setDeposit] = useState<string>('1000');
  const [depositRefunded, setDepositRefunded] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && booking) {
        setStartDate(booking.startDate);
        setEndDate(booking.endDate);
        setCleaningEndDate(booking.cleaningEndDate);
        setDurationDays(booking.durationDays);
        setSelectedCustomer({
          id: booking.customerId,
          name: booking.customerName,
          phone: booking.customerPhone,
          lineId: booking.customerLineId ?? null,
          createdAt: booking.createdAt,
        });
        setSelectedItems(
          booking.items.map((item) => ({
            ...item,
            conditionNote: item.conditionNote ?? null,
          }))
        );
        setRentalPrice(String(booking.rentalPrice));
        setPriceManuallyEdited(true);
        setDeposit(String(booking.deposit));
        setDepositRefunded(booking.depositRefunded);
        setNote(booking.note ?? '');
      } else {
        const defaultStart = getTodayISO();
        const defaultEnd = addDaysISO(defaultStart, 2);
        const defaultCleaning = addDaysISO(defaultEnd, 2);
        setStartDate(defaultStart);
        setDurationDays(3);
        setEndDate(defaultEnd);
        setCleaningEndDate(defaultCleaning);
        setSelectedCustomer(null);
        setSelectedItems([]);
        setRentalPrice('0');
        setPriceManuallyEdited(false);
        setDeposit('1000');
        setDepositRefunded(false);
        setNote('');
      }
      setItemSearch('');
      setErrorMessage(null);
      setConfirmDelete(false);
      setContentReady(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setContentReady(false);
      setErrorMessage(null);
      setConfirmDelete(false);
      setSubmitting(false);
    }, CLOSE_CLEANUP_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isOpen, mode, booking]);

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

  const suggestedPrice = useMemo(
    () => computeSuggestedPrice(selectedItems, inventoryMap, durationDays),
    [selectedItems, inventoryMap, durationDays]
  );

  useEffect(() => {
    if (!priceManuallyEdited) {
      setRentalPrice(String(suggestedPrice));
    }
  }, [suggestedPrice, priceManuallyEdited]);

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    const nextEnd = addDaysISO(newStart, Math.max(1, durationDays) - 1);
    setEndDate(nextEnd);
    setCleaningEndDate(addDaysISO(nextEnd, 2));
  };

  const handleSelectDuration = (days: number) => {
    const validDays = Math.max(1, days);
    setDurationDays(validDays);
    const nextEnd = addDaysISO(startDate, validDays - 1);
    setEndDate(nextEnd);
    setCleaningEndDate(addDaysISO(nextEnd, 2));
  };

  const handleEndDateChange = (newEnd: string) => {
    setEndDate(newEnd);
    const calcDays = diffDaysInclusiveISO(startDate, newEnd);
    setDurationDays(calcDays);
    setCleaningEndDate(addDaysISO(newEnd, 2));
  };

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

  const excludeBookingId = mode === 'edit' && booking ? booking.id : undefined;

  const filteredInventory = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return inventoryItems;
    return inventoryItems.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q)
    );
  }, [inventoryItems, itemSearch]);

  const handleToggleItem = (item: InventoryItem) => {
    const exists = selectedItems.some((li) => li.itemId === item.id);
    if (exists) {
      setSelectedItems((prev) => prev.filter((li) => li.itemId !== item.id));
      return;
    }

    const conflicts = getConflictingBookingsForItem(
      item.id,
      startDate,
      cleaningEndDate,
      bookings,
      excludeBookingId
    );
    if (conflicts.length > 0) {
      return;
    }

    const newLineItem: BookingLineItem = {
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      itemImageUrl: item.imageUrl,
      status: 'reserved',
      conditionNote: null,
    };
    setSelectedItems((prev) => [...prev, newLineItem]);
  };

  const handleItemStatusChange = (
    itemId: string,
    status: BookingItemStatus
  ) => {
    setSelectedItems((prev) =>
      prev.map((li) => (li.itemId === itemId ? { ...li, status } : li))
    );
  };

  const handleBatchStatusChange = (status: BookingItemStatus) => {
    setSelectedItems((prev) => prev.map((li) => ({ ...li, status })));
  };

  const handleItemConditionNoteChange = (itemId: string, value: string) => {
    setSelectedItems((prev) =>
      prev.map((li) =>
        li.itemId === itemId ? { ...li, conditionNote: value || null } : li
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomer) {
      setErrorMessage('กรุณาเลือกลูกค้าหรือเพิ่มลูกค้าใหม่');
      return;
    }

    if (selectedItems.length === 0) {
      setErrorMessage('กรุณาเลือกชุดที่ต้องการจองอย่างน้อย 1 ชุด');
      return;
    }

    if (!startDate || !endDate || !cleaningEndDate) {
      setErrorMessage('กรุณาระบุวันที่เช่าและวันคืนชุดให้ครบถ้วน');
      return;
    }

    if (endDate < startDate) {
      setErrorMessage('วันคืนชุดต้องไม่ก่อนวันรับชุด');
      return;
    }

    if (cleaningEndDate < endDate) {
      setErrorMessage('วันสิ้นสุดการซักต้องไม่ก่อนวันคืนชุด');
      return;
    }

    // Hard check for any conflicting items
    for (const li of selectedItems) {
      const conflicts = getConflictingBookingsForItem(
        li.itemId,
        startDate,
        cleaningEndDate,
        bookings,
        excludeBookingId
      );
      if (conflicts.length > 0) {
        setErrorMessage(
          `ชุด ${li.itemCode} ติดจองในช่วงเวลานี้ (${conflicts[0].customerName})`
        );
        return;
      }
    }

    const parsedRentalPrice = Number(rentalPrice);
    const parsedDeposit = Number(deposit);

    if (isNaN(parsedRentalPrice) || parsedRentalPrice < 0) {
      setErrorMessage('ราคาเช่ารวมต้องเป็นตัวเลขที่ถูกต้อง');
      return;
    }

    if (isNaN(parsedDeposit) || parsedDeposit < 0) {
      setErrorMessage('เงินมัดจำต้องเป็นตัวเลขที่ถูกต้อง');
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
        startDate,
        endDate,
        cleaningEndDate,
        durationDays: Math.max(1, durationDays),
        rentalPrice: parsedRentalPrice,
        deposit: parsedDeposit,
        depositRefunded,
        note: note.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
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

  const sheetClass = isMobile
    ? `bottom s ${isOpen ? 'active' : ''}`
    : `right medium m l ${isOpen ? 'active' : ''}`;

  return (
    <>
      <div
        className={`overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
        style={{ zIndex: 1000, pointerEvents: isOpen ? 'auto' : 'none' }}
      />

      <dialog
        id="booking-sheet"
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
                maxHeight: '92dvh',
                width: '100%',
                maxWidth: '100vw',
                borderRadius: '20px 20px 0 0',
                padding: '12px 16px 16px 16px',
                margin: 0,
              }
            : {
                width: '540px',
                maxWidth: '92vw',
                height: '100dvh',
                padding: '20px',
              }),
        }}
      >
        {/* Top bar */}
        <div
          className="row items-center no-margin"
          style={{ paddingBottom: '6px', flexShrink: 0 }}
        >
          <h6 className="bold no-margin">
            {mode === 'add' ? 'สร้างการจองใหม่' : 'แก้ไขการจอง'}
          </h6>
          <div className="max" />
          <button
            type="button"
            className="circle transparent no-margin"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
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
                    <p className="no-margin error-text small-text">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </article>
            )}

            <form
              id="booking-form"
              onSubmit={handleSubmit}
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                paddingTop: '4px',
                paddingBottom: '48px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                minHeight: 0,
              }}
            >
              {/* 1. Dates & Duration Section */}
              <Stack
                orientation="column"
                padding="medium"
                gap="medium"
                className="round surface-container-low border"
              >
                <Stack orientation="row" align="center" justify="space-between" wrap>
                  <Stack orientation="row" align="center" gap="small">
                    <i className="primary-text">event</i>
                    <span className="bold small-text">
                      ช่วงเวลาเช่าและเตรียมชุด *
                    </span>
                  </Stack>

                  {/* Duration Quick Pills */}
                  <Stack orientation="row" align="center" gap="tiny" wrap>
                    {[1, 3, 5].map((days) => (
                      <button
                        key={days}
                        type="button"
                        className={`chip small no-margin ${
                          durationDays === days ? 'primary' : 'border'
                        }`}
                        onClick={() => handleSelectDuration(days)}
                      >
                        {days} วัน
                      </button>
                    ))}
                  </Stack>
                </Stack>

                <div className="grid no-margin" style={{ gap: '12px' }}>
                  <div className="s12 m4">
                    <div className="field label border round no-margin">
                      <input
                        id="booking-start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        placeholder=" "
                        required
                      />
                      <label htmlFor="booking-start-date">วันรับชุด *</label>
                    </div>
                  </div>

                  <div className="s12 m4">
                    <div className="field label border round no-margin">
                      <input
                        id="booking-end-date"
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        placeholder=" "
                        required
                      />
                      <label htmlFor="booking-end-date">วันคืนชุด *</label>
                    </div>
                  </div>

                  <div className="s12 m4">
                    <div className="field label border round no-margin">
                      <input
                        id="booking-cleaning-end-date"
                        type="date"
                        value={cleaningEndDate}
                        min={endDate}
                        onChange={(e) => setCleaningEndDate(e.target.value)}
                        placeholder=" "
                        required
                      />
                      <label htmlFor="booking-cleaning-end-date">
                        เสร็จสิ้นการซัก *
                      </label>
                    </div>
                  </div>
                </div>
              </Stack>

              {/* 2. Customer Picker Section */}
              <Stack orientation="column" gap="small">
                <span className="bold small-text">ข้อมูลลูกค้า *</span>
                <CustomerPicker
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                  onCreateCustomer={handleCreateCustomerInline}
                />
              </Stack>

              {/* 3. Multi-Item Selector Section */}
              <Stack
                orientation="column"
                padding="medium"
                gap="medium"
                className="round surface-container-low border"
              >
                <Stack
                  orientation="row"
                  align="center"
                  justify="space-between"
                  wrap
                >
                  <Stack orientation="row" align="center" gap="small">
                    <i className="primary-text">checkroom</i>
                    <span className="bold small-text">
                      ชุดที่เลือก ({selectedItems.length} ชุด) *
                    </span>
                  </Stack>

                  {selectedItems.length > 1 && (
                    <Stack orientation="row" align="center" gap="tiny" wrap>
                      <span className="micro-text secondary-text">
                        ตั้งสถานะทุกชุด:
                      </span>
                      <select
                        aria-label="ตั้งสถานะทุกชุด"
                        className="small round border"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleBatchStatusChange(
                              e.target.value as BookingItemStatus
                            );
                          }
                        }}
                        defaultValue=""
                        style={{ padding: '4px 8px', height: '32px' }}
                      >
                        <option value="" disabled>
                          เลือกสถานะ...
                        </option>
                        {BOOKING_STATUS_ORDER.map((st) => (
                          <option key={st} value={st}>
                            {BOOKING_STATUS_META[st].label}
                          </option>
                        ))}
                      </select>
                    </Stack>
                  )}
                </Stack>

                {/* Selected Items List with Individual Status & Condition Note */}
                {selectedItems.length > 0 && (
                  <Stack orientation="column" gap="small">
                    {selectedItems.map((li) => (
                      <div
                        key={li.itemId}
                        className="round surface small-padding border"
                      >
                        <Stack orientation="column" gap="small">
                          <Stack
                            orientation="row"
                            align="center"
                            justify="space-between"
                            gap="small"
                            wrap
                          >
                            <Stack orientation="row" align="center" gap="small">
                              <span className="chip tiny primary-container bold no-margin">
                                {li.itemCode}
                              </span>
                              <span className="small-text bold">
                                {li.itemName}
                              </span>
                            </Stack>

                            <Stack orientation="row" align="center" gap="tiny">
                              <select
                                aria-label={`สถานะของ ${li.itemCode}`}
                                value={li.status}
                                onChange={(e) =>
                                  handleItemStatusChange(
                                    li.itemId,
                                    e.target.value as BookingItemStatus
                                  )
                                }
                                style={{
                                  padding: '4px 8px',
                                  height: '32px',
                                  borderRadius: '8px',
                                }}
                              >
                                {BOOKING_STATUS_ORDER.map((st) => (
                                  <option key={st} value={st}>
                                    {BOOKING_STATUS_META[st].label}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                className="circle transparent small no-margin"
                                onClick={() =>
                                  setSelectedItems((prev) =>
                                    prev.filter((x) => x.itemId !== li.itemId)
                                  )
                                }
                                aria-label={`นำชุด ${li.itemCode} ออก`}
                              >
                                <i>delete</i>
                              </button>
                            </Stack>
                          </Stack>

                          <div className="field small label border round no-margin">
                            <input
                              id={`condition-note-${li.itemId}`}
                              type="text"
                              value={li.conditionNote ?? ''}
                              onChange={(e) =>
                                handleItemConditionNoteChange(
                                  li.itemId,
                                  e.target.value
                                )
                              }
                              placeholder=" "
                            />
                            <label htmlFor={`condition-note-${li.itemId}`}>
                              หมายเหตุสภาพชุด / อุปกรณ์เสริม ({li.itemCode})
                            </label>
                          </div>
                        </Stack>
                      </div>
                    ))}
                  </Stack>
                )}

                {/* Search & Pick Inventory Items */}
                <div className="field small label border round no-margin">
                  <input
                    id="booking-item-search"
                    type="search"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder=" "
                  />
                  <label htmlFor="booking-item-search">
                    ค้นหาชุดในคลัง (รหัส SKU, ชื่อชุด, แบรนด์)...
                  </label>
                  <i>search</i>
                </div>

                <div
                  className="round surface border small-padding"
                  style={{
                    maxHeight: '240px',
                    overflowY: 'auto',
                  }}
                >
                  <Stack orientation="column" gap="tiny">
                    {filteredInventory.map((invItem) => {
                      const isSelected = selectedItems.some(
                        (li) => li.itemId === invItem.id
                      );
                      const conflicts = getConflictingBookingsForItem(
                        invItem.id,
                        startDate,
                        cleaningEndDate,
                        bookings,
                        excludeBookingId
                      );
                      const hasConflict = conflicts.length > 0;

                      return (
                        <div
                          key={invItem.id}
                          className={`round small-padding ${
                            isSelected
                              ? 'secondary-container'
                              : 'surface-container-low'
                          }`}
                          style={{
                            opacity: hasConflict && !isSelected ? 0.65 : 1,
                          }}
                        >
                          <Stack
                            orientation="row"
                            align="center"
                            justify="space-between"
                            gap="small"
                          >
                            <Stack
                              orientation="row"
                              align="center"
                              gap="small"
                              style={{ minWidth: 0, flex: 1 }}
                            >
                              <div
                                className="round surface-container-high"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                }}
                              >
                                {invItem.imageUrl ? (
                                  <LazyImage
                                    src={invItem.imageUrl}
                                    alt={invItem.name}
                                    containerStyle={{
                                      width: '40px',
                                      height: '40px',
                                    }}
                                    style={{ objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <i className="small secondary-text">
                                      checkroom
                                    </i>
                                  </div>
                                )}
                              </div>

                              <Stack
                                orientation="column"
                                gap="none"
                                style={{ minWidth: 0, flex: 1 }}
                              >
                                <Stack
                                  orientation="row"
                                  align="center"
                                  gap="tiny"
                                  wrap
                                >
                                  <span className="bold small-text">
                                    {invItem.code}
                                  </span>
                                  <span className="small-text">
                                    {invItem.name}
                                  </span>
                                </Stack>
                                {hasConflict && (
                                  <span className="micro-text error-text bold">
                                    ติดจองช่วงเวลานี้ ({conflicts[0].customerName})
                                  </span>
                                )}
                              </Stack>
                            </Stack>

                            <button
                              type="button"
                              className={`small round no-margin ${
                                isSelected
                                  ? 'primary'
                                  : hasConflict
                                  ? 'border'
                                  : 'border'
                              }`}
                              disabled={hasConflict && !isSelected}
                              onClick={() => handleToggleItem(invItem)}
                              aria-label={
                                isSelected
                                  ? `ยกเลิกเลือก ${invItem.code}`
                                  : `เลือกชุด ${invItem.code}`
                              }
                            >
                              {isSelected ? (
                                <>
                                  <i>check</i>
                                  <span>เลือกแล้ว</span>
                                </>
                              ) : hasConflict ? (
                                <span>ติดจองช่วงเวลานี้</span>
                              ) : (
                                <>
                                  <i>add</i>
                                  <span>เลือก</span>
                                </>
                              )}
                            </button>
                          </Stack>
                        </div>
                      );
                    })}
                  </Stack>
                </div>
              </Stack>

              {/* 4. Pricing & Deposit Section */}
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
                  wrap
                >
                  <Stack orientation="row" align="center" gap="small">
                    <i>payments</i>
                    <span className="bold small-text">
                      ราคาเช่าและเงินมัดจำ (บาท)
                    </span>
                  </Stack>
                  {priceManuallyEdited && (
                    <button
                      type="button"
                      className="chip small border transparent no-margin"
                      onClick={() => {
                        setPriceManuallyEdited(false);
                        setRentalPrice(String(suggestedPrice));
                      }}
                    >
                      ใช้ราคาแนะนำ (฿{suggestedPrice.toLocaleString()})
                    </button>
                  )}
                </Stack>

                <div className="grid no-margin" style={{ gap: '12px' }}>
                  <div className="s12 m6">
                    <div className="field label border surface round no-margin">
                      <input
                        id="booking-rental-price"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={rentalPrice}
                        onChange={(e) => {
                          setRentalPrice(e.target.value);
                          setPriceManuallyEdited(true);
                        }}
                        placeholder=" "
                        required
                      />
                      <label htmlFor="booking-rental-price">
                        ราคาเช่ารวม (฿) *
                      </label>
                    </div>
                  </div>

                  <div className="s12 m6">
                    <div className="field label border surface round no-margin">
                      <input
                        id="booking-deposit"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={deposit}
                        onChange={(e) => setDeposit(e.target.value)}
                        placeholder=" "
                        required
                      />
                      <label htmlFor="booking-deposit">เงินมัดจำ (฿) *</label>
                    </div>
                  </div>
                </div>

                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={depositRefunded}
                    onChange={(e) => setDepositRefunded(e.target.checked)}
                  />
                  <span>โอนคืนเงินมัดจำให้ลูกค้าเรียบร้อยแล้ว</span>
                </label>
              </Stack>

              {/* 5. Note Section */}
              <div className="field textarea label border round no-margin">
                <textarea
                  id="booking-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder=" "
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
                <label htmlFor="booking-note">หมายเหตุการจัดส่ง / การจอง</label>
                <i>edit_note</i>
              </div>
            </form>

            {/* 6. Delete Confirmation */}
            {confirmDelete && (
              <article
                className="border error-container round margin-top margin-bottom"
                style={{ flexShrink: 0 }}
              >
                <div className="vertical" style={{ gap: '8px' }}>
                  <div className="row items-center no-margin">
                    <i className="error-text">warning</i>
                    <div className="max">
                      <h6 className="bold no-margin error-text small">
                        ยืนยันการลบรายการนี้?
                      </h6>
                      <p className="no-margin small-text secondary-text">
                        ข้อมูลการจองของ &quot;{booking?.customerName}&quot; จะถูกลบออกจากระบบ
                      </p>
                    </div>
                  </div>
                  <div
                    className="row no-margin right-align"
                    style={{ gap: '8px' }}
                  >
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
                        <div
                          className="shape loading-indicator small"
                          role="status"
                        />
                      ) : (
                        <span>ยืนยันลบ</span>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            )}

            {/* Footer Action Buttons */}
            <div
              className="row items-center no-margin"
              style={{
                paddingTop: '12px',
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
                  title="ลบการจองนี้"
                >
                  <i>delete</i>
                  <span>ลบการจอง</span>
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
                form="booking-form"
                className="primary round no-margin"
                disabled={submitting}
                style={{ minWidth: isMobile ? '96px' : '120px' }}
              >
                {submitting ? (
                  <div
                    className="shape loading-indicator small"
                    role="status"
                  />
                ) : mode === 'edit' ? (
                  <>
                    <i>save</i>
                    <span>บันทึก</span>
                  </>
                ) : (
                  <>
                    <i>add</i>
                    <span>บันทึกการจอง</span>
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
