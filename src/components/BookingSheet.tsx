import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BOOKING_STATUS_META,
  BOOKING_STATUS_ORDER,
  addDaysISO,
  diffDaysInclusiveISO,
  formatDateThaiShort,
  formatDateThaiFull,
  getBookingStatusOnDate,
  getConflictingBookingsForItem,
  getSubsequentStatusBlock,
  getTodayISO,
  type Booking,
  type BookingItemStatus,
  type BookingLineItem,
  type BookingTransactionDates,
} from '../types/booking';
import type { Customer } from '../types/customer';
import type { InventoryItem } from '../types/inventory';
import type { NewBookingInput } from '../services/bookings';
import type { NewCustomerInput } from '../services/customers';
import { useIsMobile } from '../hooks/useIsMobile';
import { useInventory } from '../hooks/useInventory';
import { useCustomers } from '../hooks/useCustomers';
import { CustomerPicker } from './CustomerPicker';
import { BookingDateFilterBar } from './BookingDateFilterBar';
import { LazyImage } from './LazyImage';
import { Stack } from './Stack';

export interface BookingSheetProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  booking?: Booking | null;
  bookings: Booking[];
  selectedDate?: string;
  inventoryItems?: InventoryItem[];
  customers?: Customer[];
  initialStep?: number;
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

export const BookingSheet: React.FC<BookingSheetProps> = ({
  isOpen,
  mode,
  booking,
  bookings,
  selectedDate: propSelectedDate,
  inventoryItems: propInventoryItems,
  customers: propCustomers,
  initialStep = 1,
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
  const effectiveSheetDate = propSelectedDate || todayIso;

  const [contentReady, setContentReady] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
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
  const [transactionDates, setTransactionDates] =
    useState<BookingTransactionDates>({ reserved: todayIso });
  const [pendingStatusChange, setPendingStatusChange] =
    useState<BookingItemStatus | null>(null);
  const [itemSearch, setItemSearch] = useState('');
  const [rentalPrice, setRentalPrice] = useState<string>('0');
  const [priceManuallyEdited, setPriceManuallyEdited] = useState(false);
  const [deposit, setDeposit] = useState<string>('1000');
  const [depositRefunded, setDepositRefunded] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // History stack synchronization & lifecycle refs
  const pushedStepsCountRef = useRef(0);
  const isClosingRef = useRef(false);
  const prevIsOpenRef = useRef(false);
  const prevModeRef = useRef(mode);
  const prevBookingIdRef = useRef(booking?.id);

  useEffect(() => {
    if (isOpen) {
      isClosingRef.current = false;
      const isFreshOpen =
        !prevIsOpenRef.current ||
        prevModeRef.current !== mode ||
        prevBookingIdRef.current !== booking?.id;

      if (isFreshOpen) {
        prevIsOpenRef.current = true;
        prevModeRef.current = mode;
        prevBookingIdRef.current = booking?.id;

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
          setTransactionDates({ ...(booking.transactionDates ?? { reserved: booking.startDate }) });
          setRentalPrice(String(booking.rentalPrice));
          setPriceManuallyEdited(true);
          setDeposit(String(booking.deposit));
          setDepositRefunded(booking.depositRefunded);
          setNote(booking.note ?? '');
        } else {
          const defaultStart = booking?.startDate || getTodayISO();
          const defaultDuration = booking?.durationDays || 3;
          const defaultEnd = booking?.endDate || addDaysISO(defaultStart, defaultDuration - 1);
          const defaultCleaning = booking?.cleaningEndDate || addDaysISO(defaultEnd, 2);
          const defaultReservedDate = defaultStart < todayIso ? defaultStart : todayIso;
          setStartDate(defaultStart);
          setDurationDays(defaultDuration);
          setEndDate(defaultEnd);
          setCleaningEndDate(defaultCleaning);
          setSelectedCustomer(null);
          const initialItems = (booking?.items ?? []).map((item) => ({
            ...item,
            conditionNote: item.conditionNote ?? null,
          }));
          setSelectedItems(initialItems);
          setTransactionDates(
            booking?.transactionDates ?? { reserved: defaultReservedDate }
          );
          if (initialItems.length > 0) {
            const suggested = computeSuggestedPrice(initialItems, inventoryMap, defaultDuration);
            setRentalPrice(String(suggested));
          } else {
            setRentalPrice('0');
          }
          setPriceManuallyEdited(false);
          setDeposit('1000');
          setDepositRefunded(false);
          setNote('');
          setCurrentStep(initialStep);

          // Multi-step browser history stack integration
          if (typeof window !== 'undefined' && window.history) {
            pushedStepsCountRef.current = initialStep;
            window.history.pushState(
              { bookingWizardStep: initialStep },
              '',
              `${window.location.pathname}${window.location.search}#step-${initialStep}`
            );
          }
        }
        setPendingStatusChange(null);
        setItemSearch('');
        setErrorMessage(null);
        setConfirmDelete(false);
        setContentReady(true);
      }
      return;
    }

    if (prevIsOpenRef.current) {
      prevIsOpenRef.current = false;
    }

    const timer = window.setTimeout(() => {
      setContentReady(false);
      setPendingStatusChange(null);
      setErrorMessage(null);
      setConfirmDelete(false);
      setSubmitting(false);
    }, CLOSE_CLEANUP_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isOpen, mode, booking, initialStep, inventoryMap, todayIso]);

  // Listen to popstate event for browser back / forward navigation through wizard steps
  useEffect(() => {
    if (!isOpen || mode !== 'add') return;

    const handlePopState = (e: PopStateEvent) => {
      if (isClosingRef.current) return;
      const step = e.state?.bookingWizardStep;
      if (typeof step === 'number' && step >= 1 && step <= 3) {
        setCurrentStep(step);
        pushedStepsCountRef.current = step;
      } else {
        // Popped past step 1 (e.g. user pressed browser back on step 1) -> close cleanly
        isClosingRef.current = true;
        pushedStepsCountRef.current = 0;
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Clean up hash if component unmounts while step hash is still active and not actively closing
      if (
        !isClosingRef.current &&
        typeof window !== 'undefined' &&
        window.history &&
        window.location.hash.startsWith('#step-')
      ) {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}`
        );
      }
    };
  }, [isOpen, mode, onClose]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCloseCleanly();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleCloseCleanly = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (mode === 'add' && typeof window !== 'undefined' && window.history) {
      const stepsToPop = pushedStepsCountRef.current;
      pushedStepsCountRef.current = 0;
      if (stepsToPop > 0) {
        window.history.go(-stepsToPop);
      } else if (window.location.hash.startsWith('#step-')) {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}`
        );
      }
    }
    onClose();
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (typeof window !== 'undefined' && window.history) {
        pushedStepsCountRef.current = next;
        window.history.pushState(
          { bookingWizardStep: next },
          '',
          `${window.location.pathname}${window.location.search}#step-${next}`
        );
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      if (typeof window !== 'undefined' && window.history) {
        pushedStepsCountRef.current = prev;
        window.history.back();
      }
    }
  };

  const handleGoToStep = (targetStep: number) => {
    if (targetStep < currentStep) {
      const diff = currentStep - targetStep;
      setCurrentStep(targetStep);
      if (typeof window !== 'undefined' && window.history) {
        pushedStepsCountRef.current = targetStep;
        window.history.go(-diff);
      }
    }
  };

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
    const validEnd = newEnd < startDate ? startDate : newEnd;
    setEndDate(validEnd);
    const calcDays = diffDaysInclusiveISO(startDate, validEnd);
    setDurationDays(calcDays);
    setCleaningEndDate(addDaysISO(validEnd, 2));
  };

  const excludeBookingId = mode === 'edit' && booking ? booking.id : undefined;

  const selectedConflicts = useMemo(() => {
    return selectedItems.filter((li) => {
      const conflicts = getConflictingBookingsForItem(
        li.itemId,
        startDate,
        cleaningEndDate,
        bookings,
        excludeBookingId
      );
      return conflicts.length > 0;
    });
  }, [selectedItems, startDate, cleaningEndDate, bookings, excludeBookingId]);

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
      conditionNote: null,
    };
    setSelectedItems((prev) => [...prev, newLineItem]);
  };

  const currentSheetStatus = useMemo(
    () => getBookingStatusOnDate({ transactionDates }, effectiveSheetDate),
    [transactionDates, effectiveSheetDate]
  );

  const subsequentSheetBlock = useMemo(
    () => getSubsequentStatusBlock({ transactionDates }, effectiveSheetDate),
    [transactionDates, effectiveSheetDate]
  );

  const handleSheetStatusChange = (newStatus: BookingItemStatus) => {
    setErrorMessage(null);
    const block = getSubsequentStatusBlock(
      { transactionDates },
      effectiveSheetDate,
      newStatus
    );
    if (block) {
      setErrorMessage(
        `ไม่สามารถเปลี่ยนสถานะในวันที่ ${formatDateThaiShort(effectiveSheetDate)} ได้ เนื่องจากวันที่ ${formatDateThaiShort(block.date)} มีการเปลี่ยนสถานะเป็น "${BOOKING_STATUS_META[block.status].label}" แล้ว`
      );
      return;
    }

    if (effectiveSheetDate !== todayIso && newStatus !== 'reserved') {
      setPendingStatusChange(newStatus);
      return;
    }

    setTransactionDates((prev) => ({
      ...prev,
      [newStatus]: effectiveSheetDate,
    }));
  };

  const confirmSheetStatusChange = () => {
    if (!pendingStatusChange) return;
    setTransactionDates((prev) => ({
      ...prev,
      [pendingStatusChange]: effectiveSheetDate,
    }));
    setPendingStatusChange(null);
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
        transactionDates,
        startDate,
        endDate,
        cleaningEndDate,
        durationDays: Math.max(1, durationDays),
        rentalPrice: parsedRentalPrice,
        deposit: parsedDeposit,
        depositRefunded,
        note: note.trim() || null,
      });
      handleCloseCleanly();
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
      handleCloseCleanly();
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
        onClick={handleCloseCleanly}
        aria-hidden={!isOpen}
        style={{ zIndex: 1000, pointerEvents: isOpen ? 'auto' : 'none' }}
      />

      <dialog
        id="booking-sheet"
        className={sheetClass.trim()}
        open={isOpen}
        aria-hidden={!isOpen}
        aria-label={mode === 'add' ? 'สร้างการจองใหม่' : 'แก้ไขการจอง'}
        style={{
          zIndex: 1001,
          display: isOpen ? 'flex' : undefined,
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          ...(isMobile
            ? {
                height: '94dvh',
                maxHeight: '94dvh',
                width: '100%',
                maxWidth: '100vw',
                borderRadius: '20px 20px 0 0',
                padding: '12px 16px 16px 16px',
                margin: 0,
              }
            : {
                width: '560px',
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
            onClick={handleCloseCleanly}
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

            {/* ----------------- MODE === 'ADD': MULTI-STEP WIZARD ----------------- */}
            {mode === 'add' ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  overflow: 'hidden',
                }}
              >
                {/* Stepper Progress Bar */}
                <div
                  data-testid="wizard-stepper"
                  aria-label="ขั้นตอนการสร้างการจอง"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isMobile ? '3px' : '8px',
                    padding: '2px 0 8px 0',
                    flexShrink: 0,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <button
                    type="button"
                    className={`no-margin ${
                      currentStep === 1
                        ? 'fill primary bold'
                        : currentStep > 1
                        ? 'surface border primary-text'
                        : 'border secondary-text'
                    }`}
                    onClick={() => handleGoToStep(1)}
                    style={{
                      cursor: currentStep > 1 ? 'pointer' : 'default',
                      height: '28px',
                      padding: isMobile ? '0 6px' : '0 10px',
                      borderRadius: '14px',
                      fontSize: isMobile ? '12px' : '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {currentStep > 1 ? (
                      <i style={{ fontSize: '14px' }}>check</i>
                    ) : (
                      <span className="bold" style={{ fontSize: '12px' }}>
                        1
                      </span>
                    )}
                    <span>เลือกชุด</span>
                  </button>

                  <i
                    className="secondary-text"
                    style={{ fontSize: '14px', flexShrink: 0 }}
                  >
                    chevron_right
                  </i>

                  <button
                    type="button"
                    className={`no-margin ${
                      currentStep === 2
                        ? 'fill primary bold'
                        : currentStep > 2
                        ? 'surface border primary-text'
                        : 'border secondary-text'
                    }`}
                    onClick={() => handleGoToStep(2)}
                    style={{
                      cursor: currentStep > 2 ? 'pointer' : 'default',
                      height: '28px',
                      padding: isMobile ? '0 6px' : '0 10px',
                      borderRadius: '14px',
                      fontSize: isMobile ? '12px' : '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {currentStep > 2 ? (
                      <i style={{ fontSize: '14px' }}>check</i>
                    ) : (
                      <span className="bold" style={{ fontSize: '12px' }}>
                        2
                      </span>
                    )}
                    <span>ลูกค้าและราคา</span>
                  </button>

                  <i
                    className="secondary-text"
                    style={{ fontSize: '14px', flexShrink: 0 }}
                  >
                    chevron_right
                  </i>

                  <button
                    type="button"
                    className={`no-margin ${
                      currentStep === 3
                        ? 'fill primary bold'
                        : 'border secondary-text'
                    }`}
                    style={{
                      cursor: 'default',
                      height: '28px',
                      padding: isMobile ? '0 6px' : '0 10px',
                      borderRadius: '14px',
                      fontSize: isMobile ? '12px' : '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span className="bold" style={{ fontSize: '12px' }}>
                      3
                    </span>
                    <span>ยืนยันการจอง</span>
                  </button>
                </div>

                {/* ----------------- STEP 1: SELECT OUTFIT ----------------- */}
                {currentStep === 1 && (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Date and duration filter at the top (matching layout reference image) */}
                    <BookingDateFilterBar
                      startDate={startDate}
                      durationDays={durationDays}
                      endDate={endDate}
                      cleaningEndDate={cleaningEndDate}
                      onStartDateChange={handleStartDateChange}
                      onDurationChange={handleSelectDuration}
                      onEndDateChange={handleEndDateChange}
                    />

                    {/* Outfit search filter */}
                    <div
                      className="field small prefix border no-margin"
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                        marginBottom: '8px',
                        position: 'relative',
                      }}
                    >
                      <i className="front">search</i>
                      <input
                        id="wizard-outfit-search"
                        type="search"
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        placeholder="ค้นหาชุดในคลัง (SKU, ชื่อชุด, แบรนด์)..."
                        aria-label="ค้นหาชุดในคลัง (SKU, ชื่อชุด, แบรนด์)..."
                      />
                      <label
                        htmlFor="wizard-outfit-search"
                        style={{
                          position: 'absolute',
                          width: '1px',
                          height: '1px',
                          padding: 0,
                          margin: '-1px',
                          overflow: 'hidden',
                          clip: 'rect(0, 0, 0, 0)',
                          whiteSpace: 'nowrap',
                          border: 0,
                        }}
                      >
                        ค้นหาชุดในคลัง (SKU, ชื่อชุด, แบรนด์)...
                      </label>
                      {itemSearch && (
                        <button
                          type="button"
                          className="circle transparent trailing"
                          onClick={() => setItemSearch('')}
                          aria-label="ล้างการค้นหา"
                          style={{
                            position: 'absolute',
                            right: '4px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '32px',
                            height: '32px',
                          }}
                        >
                          <i>close</i>
                        </button>
                      )}
                    </div>

                    {/* Full height outfit list */}
                    <div
                      className="wizard-outfit-list-container"
                      data-testid="wizard-outfit-list"
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        minHeight: 0,
                        WebkitOverflowScrolling: 'touch',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        paddingRight: '4px',
                      }}
                    >
                      {filteredInventory.length === 0 ? (
                        <div className="center-align padding secondary-text">
                          <i>search_off</i>
                          <p className="small-text top-margin-tiny">
                            ไม่พบชุดที่ตรงกับคำค้นหา
                          </p>
                        </div>
                      ) : (
                        filteredInventory.map((invItem) => {
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
                          const priceForDuration = getItemRentalPriceForDuration(
                            invItem,
                            durationDays
                          );

                          const isSelectedConflict = isSelected && hasConflict;

                          return (
                            <div
                              key={invItem.id}
                              className={`border small-padding cursor-pointer ${
                                isSelected
                                  ? isSelectedConflict
                                    ? 'error-container'
                                    : 'secondary-container'
                                  : 'surface-container-low'
                              }`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'all 0.15s ease',
                                opacity: hasConflict && !isSelected ? 0.6 : 1,
                                borderWidth: isSelected ? '2px' : '1px',
                                borderColor: isSelected
                                  ? isSelectedConflict
                                    ? 'var(--error)'
                                    : 'var(--primary)'
                                  : undefined,
                                borderRadius: '12px',
                              }}
                              onClick={() => {
                                if (!hasConflict || isSelected) {
                                  handleToggleItem(invItem);
                                }
                              }}
                            >
                              {/* Thumbnail */}
                              <div
                                className="surface-container-high"
                                style={{
                                  width: '52px',
                                  height: '52px',
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                  borderRadius: '8px',
                                }}
                              >
                                {invItem.imageUrl ? (
                                  <LazyImage
                                    src={invItem.imageUrl}
                                    alt={invItem.name}
                                    containerStyle={{
                                      width: '52px',
                                      height: '52px',
                                    }}
                                    style={{ objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: '52px',
                                      height: '52px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <i className="secondary-text">checkroom</i>
                                  </div>
                                )}
                              </div>

                              {/* Details */}
                              <div
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <span
                                    className="chip tiny primary-container bold no-margin"
                                    style={{
                                      borderRadius: '6px',
                                      padding: '0 6px',
                                      height: '20px',
                                      fontSize: '11px',
                                    }}
                                  >
                                    {invItem.code}
                                  </span>
                                  <span
                                    className="bold small-text"
                                    style={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {invItem.name}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    flexWrap: 'wrap',
                                    lineHeight: '1.2',
                                  }}
                                >
                                  {invItem.brand && (
                                    <span className="micro-text secondary-text">
                                      {invItem.brand}
                                    </span>
                                  )}
                                  {invItem.size && (
                                    <span className="micro-text secondary-text">
                                      • ไซส์ {invItem.size}
                                    </span>
                                  )}
                                  <span className="bold micro-text primary-text">
                                    • ฿{priceForDuration.toLocaleString()} / {durationDays} วัน
                                  </span>
                                </div>

                                {hasConflict && (
                                  <span
                                    className="micro-text error-text bold"
                                    style={{ lineHeight: '1.2' }}
                                  >
                                    ติดจองช่วงเวลานี้ ({conflicts[0].customerName})
                                  </span>
                                )}
                              </div>

                              {/* Action Button */}
                              <button
                                type="button"
                                className={`small no-margin ${
                                  isSelected
                                    ? isSelectedConflict
                                      ? 'fill error'
                                      : 'fill primary'
                                    : 'border'
                                }`}
                                disabled={hasConflict && !isSelected}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleItem(invItem);
                                }}
                                aria-label={
                                  isSelected
                                    ? `ยกเลิกเลือก ${invItem.code}`
                                    : `เลือกชุด ${invItem.code}`
                                }
                                style={{
                                  flexShrink: 0,
                                  borderRadius: '8px',
                                  padding: '0 10px',
                                  height: '32px',
                                  fontSize: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  cursor:
                                    hasConflict && !isSelected
                                      ? 'not-allowed'
                                      : 'pointer',
                                  opacity: hasConflict && !isSelected ? 0.7 : 1,
                                }}
                              >
                                {isSelected ? (
                                  <>
                                    <i style={{ fontSize: '16px' }}>
                                      {isSelectedConflict ? 'warning' : 'check'}
                                    </i>
                                    <span>
                                      {isSelectedConflict
                                        ? 'ติดจอง (คลิกเพื่อยกเลิก)'
                                        : 'เลือกแล้ว'}
                                    </span>
                                  </>
                                ) : hasConflict ? (
                                  <>
                                    <i
                                      style={{
                                        fontSize: '14px',
                                        marginRight: '2px',
                                      }}
                                    >
                                      event_busy
                                    </i>
                                    <span>ติดจอง</span>
                                  </>
                                ) : (
                                  <>
                                    <i style={{ fontSize: '16px' }}>add</i>
                                    <span>เลือก</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Step 1 Footer */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--surface-variant)',
                        flexShrink: 0,
                        gap: '8px',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      {selectedConflicts.length > 0 && (
                        <div
                          className="error-text small-text"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            width: '100%',
                          }}
                        >
                          <i className="tiny">error</i>
                          <span>
                            มีชุดที่ติดจองในช่วงเวลานี้ (
                            {selectedConflicts.map((c) => c.itemCode).join(', ')}
                            ): กรุณายกเลิกหรือเปลี่ยนช่วงเวลา
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <span
                            className="bold small-text"
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            {selectedItems.length > 0
                              ? `เลือกแล้ว ${selectedItems.length} ชุด`
                              : 'เลือกชุดอย่างน้อย 1 ชุด'}
                          </span>
                          {selectedItems.length > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '4px',
                              }}
                            >
                              {selectedItems.map((li) => {
                                const isLiConflict = selectedConflicts.some(
                                  (c) => c.itemId === li.itemId
                                );
                                return (
                                  <button
                                    key={li.itemId}
                                    type="button"
                                    className={`chip tiny bold no-margin ${
                                      isLiConflict
                                        ? 'fill error'
                                        : 'primary-container'
                                    }`}
                                    onClick={() => {
                                      const inv = inventoryMap.get(li.itemId);
                                      if (inv) handleToggleItem(inv);
                                      else {
                                        setSelectedItems((prev) =>
                                          prev.filter(
                                            (item) => item.itemId !== li.itemId
                                          )
                                        );
                                      }
                                    }}
                                    title="คลิกเพื่อยกเลิกการเลือกชุดนี้"
                                    style={{
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      borderRadius: '6px',
                                      padding: '0 6px',
                                      height: '20px',
                                    }}
                                  >
                                    <span>{li.itemCode}</span>
                                    <i className="micro">close</i>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexShrink: 0,
                          }}
                        >
                          <button
                            type="button"
                            className="border no-margin"
                            onClick={handleCloseCleanly}
                            style={{ borderRadius: '10px' }}
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            className="primary no-margin"
                            data-testid="wizard-next-step-1"
                            disabled={
                              selectedItems.length === 0 ||
                              selectedConflicts.length > 0
                            }
                            onClick={handleNextStep}
                            style={{ borderRadius: '10px' }}
                          >
                            <span>ถัดไป</span>
                            <i>arrow_forward</i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ----------------- STEP 2: CUSTOMER + PRICE & NOTES ----------------- */}
                {currentStep === 2 && (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        minHeight: 0,
                        WebkitOverflowScrolling: 'touch',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        paddingRight: '4px',
                        paddingBottom: '16px',
                      }}
                    >
                      {/* Customer Picker Section */}
                      <Stack orientation="column" gap="small">
                        <span className="bold small-text">ข้อมูลลูกค้า *</span>
                        <CustomerPicker
                          customers={customers}
                          selectedCustomer={selectedCustomer}
                          onSelectCustomer={setSelectedCustomer}
                          onCreateCustomer={handleCreateCustomerInline}
                        />
                      </Stack>

                      {/* Pricing & Deposit Section */}
                      <Stack
                        orientation="column"
                        padding="medium"
                        gap="medium"
                        className="tertiary-container"
                        style={{ borderRadius: '16px' }}
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
                              style={{ borderRadius: '8px' }}
                            >
                              ใช้ราคาแนะนำ (฿{suggestedPrice.toLocaleString()})
                            </button>
                          )}
                        </Stack>

                        {/* Selected outfits price recap */}
                        <div
                          className="surface border small-padding"
                          style={{ fontSize: '13px', borderRadius: '12px' }}
                        >
                          <div className="bold" style={{ marginBottom: '6px' }}>
                            สรุปราคาแนะนำ ({selectedItems.length} ชุด, {durationDays} วัน):
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                            }}
                          >
                            {selectedItems.map((li) => {
                              const inv = inventoryMap.get(li.itemId);
                              const p = inv
                                ? getItemRentalPriceForDuration(inv, durationDays)
                                : 0;
                              return (
                                <div
                                  key={li.itemId}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '8px',
                                  }}
                                >
                                  <span
                                    style={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    <strong>{li.itemCode}</strong> {li.itemName}
                                  </span>
                                  <span
                                    className="bold"
                                    style={{ flexShrink: 0 }}
                                  >
                                    ฿{p.toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderTop: '1px solid var(--surface-variant)',
                                paddingTop: '4px',
                                marginTop: '4px',
                              }}
                            >
                              <span className="bold">รวมราคาแนะนำ:</span>
                              <span className="bold primary-text">
                                ฿{suggestedPrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid no-margin" style={{ gap: '12px' }}>
                          <div className="s12 m6">
                            <div
                              className="field label border surface no-margin"
                              style={{ borderRadius: '12px' }}
                            >
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
                            <div
                              className="field label border surface no-margin"
                              style={{ borderRadius: '12px' }}
                            >
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
                              <label htmlFor="booking-deposit">
                                เงินมัดจำ (฿) *
                              </label>
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

                      {/* Condition Notes per selected outfit */}
                      {selectedItems.length > 0 && (
                        <Stack
                          orientation="column"
                          padding="medium"
                          gap="small"
                          className="surface-container-low border"
                          style={{ borderRadius: '16px' }}
                        >
                          <span className="bold small-text">
                            หมายเหตุสภาพชุด / อุปกรณ์เสริม (ถ้ามี)
                          </span>
                          {selectedItems.map((li) => (
                            <div
                              key={li.itemId}
                              className="field small label border no-margin"
                              style={{ borderRadius: '12px', width: '100%' }}
                            >
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
                                สภาพชุด / อุปกรณ์เสริม ({li.itemCode})
                              </label>
                            </div>
                          ))}
                        </Stack>
                      )}

                      {/* Booking Note Section */}
                      <div
                        className="field textarea label border no-margin"
                        style={{ borderRadius: '12px' }}
                      >
                        <textarea
                          id="booking-note"
                          rows={3}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder=" "
                          style={{ minHeight: '80px', resize: 'vertical' }}
                        />
                        <label htmlFor="booking-note">
                          หมายเหตุการจัดส่ง / การจอง
                        </label>
                        <i>edit_note</i>
                      </div>
                    </div>

                    {/* Step 2 Footer */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--surface-variant)',
                        flexShrink: 0,
                        gap: '8px',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <button
                        type="button"
                        className="border no-margin"
                        data-testid="wizard-prev-step-2"
                        onClick={handlePrevStep}
                        style={{ borderRadius: '10px' }}
                      >
                        <i>arrow_back</i>
                        <span>ย้อนกลับ</span>
                      </button>

                      <button
                        type="button"
                        className="primary no-margin"
                        data-testid="wizard-next-step-2"
                        disabled={
                          !selectedCustomer ||
                          isNaN(Number(rentalPrice)) ||
                          Number(rentalPrice) < 0 ||
                          isNaN(Number(deposit)) ||
                          Number(deposit) < 0
                        }
                        onClick={handleNextStep}
                        style={{ borderRadius: '10px' }}
                      >
                        <span>ถัดไป: ตรวจสอบ</span>
                        <i>arrow_forward</i>
                      </button>
                    </div>
                  </div>
                )}

                {/* ----------------- STEP 3: CONFIRMATION & REVIEW ----------------- */}
                {currentStep === 3 && (
                  <form
                    id="booking-form"
                    onSubmit={handleSubmit}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        minHeight: 0,
                        WebkitOverflowScrolling: 'touch',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        paddingRight: '4px',
                        paddingBottom: '16px',
                      }}
                    >
                      {/* Review Card 1: Rental Schedule */}
                      <article
                        className="border surface-container-low padding no-margin"
                        style={{ borderRadius: '16px' }}
                      >
                        <Stack orientation="column" gap="small">
                          <div className="row items-center no-margin" style={{ gap: '6px' }}>
                            <i className="primary-text">event</i>
                            <span className="bold small-text">ช่วงเวลาเช่า</span>
                          </div>
                          <div className="grid no-margin" style={{ gap: '8px' }}>
                            <div className="s6">
                              <span className="micro-text secondary-text">วันรับชุด</span>
                              <div className="bold">{formatDateThaiFull(startDate)}</div>
                            </div>
                            <div className="s6">
                              <span className="micro-text secondary-text">
                                วันส่งคืน ({durationDays} วัน)
                              </span>
                              <div className="bold">{formatDateThaiFull(endDate)}</div>
                            </div>
                            <div className="s12">
                              <span className="micro-text secondary-text">
                                วันสิ้นสุดการทำความสะอาด (พร้อมให้เช่าต่อ)
                              </span>
                              <div className="bold primary-text">
                                {formatDateThaiFull(cleaningEndDate)} (รวมเวลาซัก 2 วัน)
                              </div>
                            </div>
                          </div>
                        </Stack>
                      </article>

                      {/* Review Card 2: Selected Outfits */}
                      <article
                        className="border surface-container-low padding no-margin"
                        style={{ borderRadius: '16px' }}
                      >
                        <Stack orientation="column" gap="small">
                          <div className="row items-center no-margin" style={{ gap: '6px' }}>
                            <i className="primary-text">checkroom</i>
                            <span className="bold small-text">
                              ชุดที่เลือก ({selectedItems.length} ชุด)
                            </span>
                          </div>
                          <div className="column" style={{ gap: '8px' }}>
                            {selectedItems.map((li) => (
                              <div
                                key={li.itemId}
                                className="surface border small-padding"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                  borderRadius: '10px',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    minWidth: 0,
                                  }}
                                >
                                  <span
                                    className="chip tiny primary-container bold no-margin"
                                    style={{
                                      borderRadius: '6px',
                                      padding: '0 6px',
                                      height: '20px',
                                    }}
                                  >
                                    {li.itemCode}
                                  </span>
                                  <span className="small-text bold truncate">
                                    {li.itemName}
                                  </span>
                                </div>
                                {li.conditionNote && (
                                  <span
                                    className="micro-text secondary-text truncate"
                                    style={{ maxWidth: '45%' }}
                                  >
                                    หมายเหตุ: {li.conditionNote}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </Stack>
                      </article>

                      {/* Review Card 3: Customer Information */}
                      <article
                        className="border surface-container-low padding no-margin"
                        style={{ borderRadius: '16px' }}
                      >
                        <Stack orientation="column" gap="small">
                          <div className="row items-center no-margin" style={{ gap: '6px' }}>
                            <i className="primary-text">person</i>
                            <span className="bold small-text">ข้อมูลลูกค้า</span>
                          </div>
                          <div className="grid no-margin" style={{ gap: '8px' }}>
                            <div className="s12 m6">
                              <span className="micro-text secondary-text">ชื่อลูกค้า</span>
                              <div className="bold">{selectedCustomer?.name}</div>
                            </div>
                            <div className="s12 m6">
                              <span className="micro-text secondary-text">เบอร์โทรศัพท์</span>
                              <div className="bold">{selectedCustomer?.phone}</div>
                            </div>
                            {selectedCustomer?.lineId && (
                              <div className="s12">
                                <span className="micro-text secondary-text">LINE ID</span>
                                <div>{selectedCustomer.lineId}</div>
                              </div>
                            )}
                          </div>
                        </Stack>
                      </article>

                      {/* Review Card 4: Pricing & Deposit */}
                      <article
                        className="border tertiary-container padding no-margin"
                        style={{ borderRadius: '16px' }}
                      >
                        <Stack orientation="column" gap="small">
                          <div className="row items-center no-margin" style={{ gap: '6px' }}>
                            <i>payments</i>
                            <span className="bold small-text">สรุปยอดชำระ</span>
                          </div>
                          <div className="column" style={{ gap: '6px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>ราคาเช่ารวม:</span>
                              <span className="bold">
                                ฿{Number(rentalPrice).toLocaleString()}
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>เงินมัดจำ:</span>
                              <span className="bold">
                                ฿{Number(deposit).toLocaleString()}
                                {depositRefunded ? ' (โอนคืนแล้ว)' : ' (รอโอนคืน)'}
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderTop: '1px solid var(--surface-variant)',
                                paddingTop: '6px',
                                marginTop: '4px',
                              }}
                            >
                              <span className="bold">ยอดรวมสุทธิ:</span>
                              <span className="bold large-text primary-text">
                                ฿{(Number(rentalPrice) + Number(deposit)).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </Stack>
                      </article>

                      {/* Review Card 5: Notes (if any) */}
                      {note.trim() && (
                        <article
                          className="border surface-container-low padding no-margin"
                          style={{ borderRadius: '16px' }}
                        >
                          <Stack orientation="column" gap="tiny">
                            <span className="micro-text secondary-text bold">
                              หมายเหตุการจัดส่ง / การจอง:
                            </span>
                            <p className="no-margin small-text">{note}</p>
                          </Stack>
                        </article>
                      )}
                    </div>

                    {/* Step 3 Footer */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--surface-variant)',
                        flexShrink: 0,
                        gap: '8px',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <button
                        type="button"
                        className="border no-margin"
                        data-testid="wizard-prev-step-3"
                        disabled={submitting}
                        onClick={handlePrevStep}
                        style={{ borderRadius: '10px' }}
                      >
                        <i>arrow_back</i>
                        <span>ย้อนกลับ</span>
                      </button>

                      <button
                        type="submit"
                        className="primary no-margin"
                        data-testid="wizard-submit-booking"
                        disabled={submitting}
                        style={{
                          minWidth: isMobile ? '120px' : '150px',
                          borderRadius: '10px',
                        }}
                      >
                        {submitting ? (
                          <div
                            className="shape loading-indicator small"
                            role="status"
                          />
                        ) : (
                          <>
                            <i>check</i>
                            <span>ยืนยันการจอง</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* ----------------- MODE === 'EDIT': EXISTING SINGLE SHEET LAYOUT ----------------- */
              <>
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
                    <Stack
                      orientation="row"
                      align="center"
                      justify="space-between"
                      wrap
                    >
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
                            onChange={(e) =>
                              handleStartDateChange(e.target.value)
                            }
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
                            onChange={(e) =>
                              handleEndDateChange(e.target.value)
                            }
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
                            onChange={(e) =>
                              setCleaningEndDate(e.target.value)
                            }
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

                  {/* 2.5 Booking Status & Transaction Dates (Edit mode) */}
                  <Stack
                    orientation="column"
                    padding="medium"
                    gap="small"
                    className="round surface-container-low border"
                  >
                    <Stack
                      orientation="row"
                      align="center"
                      justify="space-between"
                      wrap
                    >
                      <Stack orientation="row" align="center" gap="small">
                        <i className="primary-text">history_edu</i>
                        <span className="bold small-text">
                          สถานะการจอง ({formatDateThaiShort(effectiveSheetDate)})
                        </span>
                      </Stack>

                      <select
                        aria-label="สถานะการจอง"
                        value={currentSheetStatus}
                        disabled={Boolean(subsequentSheetBlock)}
                        onChange={(e) =>
                          handleSheetStatusChange(
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
                    </Stack>

                    {subsequentSheetBlock && (
                      <div
                        className="round small-padding border"
                        style={{
                          backgroundColor: 'var(--error-container)',
                          color: 'var(--on-error-container)',
                          fontSize: '12px',
                        }}
                      >
                        ไม่สามารถแก้ไขสถานะในวันที่{' '}
                        {formatDateThaiShort(effectiveSheetDate)} ได้ เนื่องจากวันที่{' '}
                        <strong>
                          {formatDateThaiShort(subsequentSheetBlock.date)}
                        </strong>{' '}
                        เปลี่ยนเป็นสถานะ "
                        {BOOKING_STATUS_META[subsequentSheetBlock.status].label}"
                        แล้ว
                      </div>
                    )}

                    {pendingStatusChange && (
                      <div
                        className="round small-padding border"
                        style={{
                          backgroundColor: 'var(--tertiary-container)',
                          color: 'var(--on-tertiary-container)',
                        }}
                      >
                        <Stack orientation="column" gap="small">
                          <span className="small-text bold">
                            ยืนยันการเปลี่ยนสถานะในวันที่{' '}
                            {formatDateThaiShort(effectiveSheetDate)}{' '}
                            (ไม่ใช่วันปัจจุบัน) เป็น "
                            {BOOKING_STATUS_META[pendingStatusChange].label}"?
                          </span>
                          <Stack orientation="row" gap="small" justify="flex-end">
                            <button
                              type="button"
                              className="border small round no-margin"
                              onClick={() => setPendingStatusChange(null)}
                            >
                              ยกเลิก
                            </button>
                            <button
                              type="button"
                              className="primary small round no-margin"
                              onClick={confirmSheetStatusChange}
                            >
                              ยืนยัน
                            </button>
                          </Stack>
                        </Stack>
                      </div>
                    )}

                    {/* Transaction History Chips */}
                    <Stack orientation="row" align="center" gap="tiny" wrap>
                      {BOOKING_STATUS_ORDER.filter(
                        (st) => Boolean(transactionDates[st])
                      ).map((st) => (
                        <span
                          key={st}
                          className="chip tiny border no-margin"
                          style={{ height: '24px', fontSize: '11px' }}
                        >
                          {BOOKING_STATUS_META[st].label}:{' '}
                          {formatDateThaiShort(transactionDates[st]!)}
                        </span>
                      ))}
                    </Stack>
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
                    </Stack>

                    {/* Selected Items List with Condition Note */}
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
                                <Stack
                                  orientation="row"
                                  align="center"
                                  gap="small"
                                >
                                  <span className="chip tiny primary-container bold no-margin">
                                    {li.itemCode}
                                  </span>
                                  <span className="small-text bold">
                                    {li.itemName}
                                  </span>
                                </Stack>

                                <Stack
                                  orientation="row"
                                  align="center"
                                  gap="tiny"
                                >
                                  <button
                                    type="button"
                                    className="circle transparent small no-margin"
                                    onClick={() =>
                                      setSelectedItems((prev) =>
                                        prev.filter(
                                          (x) => x.itemId !== li.itemId
                                        )
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

                {/* Footer Action Buttons for Edit Mode */}
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
                    onClick={handleCloseCleanly}
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
                    ) : (
                      <>
                        <i>save</i>
                        <span>บันทึก</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </dialog>
    </>
  );
};
