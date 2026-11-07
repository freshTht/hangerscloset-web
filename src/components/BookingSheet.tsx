import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { InventoryCard } from '../common/components/InventoryCard';
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
  initialStep?: number;
  lockStepMin?: number;
  allowStepBackTo1?: boolean;
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

function getStepButtonClass(step: number, currentStep: number): string {
  if (currentStep === step) {
    return 'fill primary bold';
  }
  if (currentStep > step) {
    return 'surface border primary-text clickable';
  }
  return 'border secondary-text';
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

function getOutfitCardClass(isSelected: boolean, hasConflict: boolean): string {
  if (isSelected && hasConflict) {
    return 'error-container error-border is-selected is-conflict';
  }
  if (isSelected) {
    return 'secondary-container primary-border is-selected';
  }
  if (hasConflict) {
    return 'surface-container-low is-conflict';
  }
  return 'surface-container-low';
}

function getOutfitButtonClass(isSelected: boolean, hasConflict: boolean): string {
  if (isSelected && hasConflict) {
    return 'fill error';
  }
  if (isSelected) {
    return 'fill primary';
  }
  return 'border';
}

function renderOutfitButtonContent(isSelected: boolean, hasConflict: boolean) {
  if (isSelected) {
    return (
      <>
        <i className="tiny">{hasConflict ? 'warning' : 'check'}</i>
        <span>{hasConflict ? 'ติดจอง (คลิกเพื่อยกเลิก)' : 'เลือกแล้ว'}</span>
      </>
    );
  }
  if (hasConflict) {
    return (
      <>
        <i className="tiny hc-booking-sheet-icon-gap-right">event_busy</i>
        <span>ติดจอง</span>
      </>
    );
  }
  return (
    <>
      <i className="tiny">add</i>
      <span>เลือก</span>
    </>
  );
}

function renderEditOutfitButtonContent(isSelected: boolean, hasConflict: boolean) {
  if (isSelected) {
    return (
      <>
        <i>check</i>
        <span>เลือกแล้ว</span>
      </>
    );
  }
  if (hasConflict) {
    return <span>ติดจองช่วงเวลานี้</span>;
  }
  return (
    <>
      <i>add</i>
      <span>เลือก</span>
    </>
  );
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
  lockStepMin,
  allowStepBackTo1,
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

  const isStep1Restricted =
    (lockStepMin !== undefined && lockStepMin > 1) || allowStepBackTo1 === false;

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
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

        if ((mode === 'edit' || mode === 'view') && booking) {
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
            setRentalPrice(String(booking?.rentalPrice || suggested));
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
            pushedStepsCountRef.current = 1;
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
  }, [isOpen, mode, booking, initialStep, lockStepMin, allowStepBackTo1, inventoryMap, todayIso]);

  // Listen to popstate event for browser back / forward navigation through wizard steps
  useEffect(() => {
    if (!isOpen || mode !== 'add') return;

    const handlePopState = (e: PopStateEvent) => {
      if (isClosingRef.current) return;
      const step = e.state?.bookingWizardStep;
      const minAllowedStep = isStep1Restricted ? 2 : 1;
      if (typeof step === 'number' && step >= minAllowedStep && step <= 3) {
        setCurrentStep(step);
        pushedStepsCountRef.current = Math.max(1, step - initialStep + 1);
      } else {
        // Popped past min allowed step (e.g. user pressed browser back on step 1, or step 2 when restricted) -> close cleanly
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
  }, [isOpen, mode, isStep1Restricted, initialStep, onClose]);

  const handleCloseCleanly = useCallback(() => {
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
  }, [mode, onClose]);

  const handleNextStep = () => {
    if (currentStep < 3) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (typeof window !== 'undefined' && window.history) {
        pushedStepsCountRef.current += 1;
        window.history.pushState(
          { bookingWizardStep: next },
          '',
          `${window.location.pathname}${window.location.search}#step-${next}`
        );
      }
    }
  };

  const handlePrevStep = () => {
    if (isStep1Restricted && currentStep === 2) {
      handleCloseCleanly();
      return;
    }
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      if (typeof window !== 'undefined' && window.history) {
        pushedStepsCountRef.current = Math.max(0, pushedStepsCountRef.current - 1);
        window.history.back();
      }
    }
  };

  const handleGoToStep = (targetStep: number) => {
    if (isStep1Restricted && targetStep < 2) {
      handleCloseCleanly();
      return;
    }
    if (targetStep < currentStep) {
      const diff = currentStep - targetStep;
      setCurrentStep(targetStep);
      if (typeof window !== 'undefined' && window.history) {
        pushedStepsCountRef.current = Math.max(0, pushedStepsCountRef.current - diff);
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

  const excludeBookingId =
    (mode === 'edit' || mode === 'view') && booking ? booking.id : undefined;

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

  return (
    <Modal
      visible={isOpen}
      variant="bottom-sheet"
      onClose={handleCloseCleanly}
      id="booking-sheet"
      testId="booking-sheet"
      overlayClassName="hc-booking-sheet-overlay"
      className="hc-booking-sheet-dialog"
      ariaLabel={getSheetTitle(mode)}
      dialogRef={dialogRef}
    >
        {/* Top bar */}
        <div className="row no-margin hc-booking-sheet-top-bar">
          <h6 className="bold no-margin">
            {getSheetTitle(mode)}
          </h6>
          <div className="max" />
          <button
            ref={closeBtnRef}
            type="button"
            className="circle transparent no-margin hc-booking-sheet-close-btn"
            onClick={handleCloseCleanly}
            aria-label="ปิดหน้าต่าง"
          >
            <i>close</i>
          </button>
        </div>

        {contentReady && (
          <>
            {errorMessage && (
              <article className="border error-container margin-bottom hc-booking-sheet-error-banner">
                <div className="row no-margin">
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
              <div className="hc-booking-sheet-wizard-wrap">
                {/* Stepper Progress Bar */}
                <div
                  data-testid="wizard-stepper"
                  aria-label="ขั้นตอนการสร้างการจอง"
                  className="hc-booking-sheet-stepper"
                >
                  <button
                    type="button"
                    className={`no-margin hc-booking-sheet-step-btn ${getStepButtonClass(1, currentStep)} ${isMobile ? 'small-text' : 'medium-text'}`}
                    onClick={() => {
                      if (isStep1Restricted) {
                        handleCloseCleanly();
                      } else {
                        handleGoToStep(1);
                      }
                    }}
                    title={
                      isStep1Restricted
                        ? 'ปิดและกลับสู่หน้ารายการชุด'
                        : undefined
                    }
                  >
                    {(() => {
                      if (isStep1Restricted) return <i className="small">close</i>;
                      if (currentStep > 1) return <i className="small">check</i>;
                      return <span className="bold small-text">1</span>;
                    })()}
                    <span>เลือกชุด</span>
                  </button>

                  <i className="secondary-text small hc-booking-sheet-step-arrow">
                    chevron_right
                  </i>

                  <button
                    type="button"
                    className={`no-margin hc-booking-sheet-step-btn ${getStepButtonClass(2, currentStep)} ${isMobile ? 'small-text' : 'medium-text'}`}
                    onClick={() => handleGoToStep(2)}
                  >
                    {currentStep > 2 ? (
                      <i className="small">check</i>
                    ) : (
                      <span className="bold small-text">
                        2
                      </span>
                    )}
                    <span>ลูกค้าและราคา</span>
                  </button>

                  <i className="secondary-text small hc-booking-sheet-step-arrow">
                    chevron_right
                  </i>

                  <button
                    type="button"
                    className={`no-margin hc-booking-sheet-step-btn ${getStepButtonClass(3, currentStep)} ${isMobile ? 'small-text' : 'medium-text'}`}
                  >
                    <span className="bold small-text">
                      3
                    </span>
                    <span>ยืนยันการจอง</span>
                  </button>
                </div>

                {/* ----------------- STEP 1: SELECT OUTFIT ----------------- */}
                {currentStep === 1 && (
                  <div className="hc-booking-sheet-step-content">
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
                    <div className="field small prefix border no-margin hc-booking-sheet-search-wrap">
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
                        className="hc-booking-sheet-sr-only"
                      >
                        ค้นหาชุดในคลัง (SKU, ชื่อชุด, แบรนด์)...
                      </label>
                      {itemSearch && (
                        <button
                          type="button"
                          className="circle transparent trailing hc-booking-sheet-search-clear"
                          onClick={() => setItemSearch('')}
                          aria-label="ล้างการค้นหา"
                        >
                          <i>close</i>
                        </button>
                      )}
                    </div>

                    {/* Full height outfit list */}
                    <div
                      data-testid="wizard-outfit-list"
                      className="hc-booking-sheet-outfit-list"
                    >
                      {filteredInventory.length === 0 ? (
                        <div className="center-align padding secondary-text">
                          <i>search_off</i>
                          <p className="small-text top-margin tiny-margin">
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

                          return (
                            <InventoryCard
                              key={invItem.id}
                              item={invItem}
                              size="sm"
                              variant="outlined"
                              selected={isSelected}
                              hasConflict={hasConflict}
                              className={getOutfitCardClass(isSelected, hasConflict)}
                              onClick={() => {
                                if (!hasConflict || isSelected) {
                                  handleToggleItem(invItem);
                                }
                              }}
                              metaSlot={
                                <>
                                  {invItem.brand && (
                                    <span className="hc-micro-text secondary-text">
                                      {invItem.brand}
                                    </span>
                                  )}
                                  {invItem.size && (
                                    <span className="hc-micro-text secondary-text">
                                      • ไซส์ {invItem.size}
                                    </span>
                                  )}
                                  <span className="bold hc-micro-text primary-text">
                                    • ฿{priceForDuration.toLocaleString()} / {durationDays} วัน
                                  </span>
                                </>
                              }
                              noteSlot={
                                hasConflict ? (
                                  <span className="hc-micro-text error-text bold hc-booking-sheet-outfit-conflict-text">
                                    ติดจองช่วงเวลานี้ ({conflicts[0].customerName})
                                  </span>
                                ) : undefined
                              }
                              trailingActionSlot={
                                <button
                                  type="button"
                                  className={`small no-margin hc-booking-sheet-outfit-select-btn ${getOutfitButtonClass(isSelected, hasConflict)} small-text`}
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
                                >
                                  {renderOutfitButtonContent(isSelected, hasConflict)}
                                </button>
                              }
                            />
                          );
                        })
                      )}
                    </div>

                    {/* Step 1 Footer */}
                    <div className="hc-booking-sheet-step-footer">
                      {selectedConflicts.length > 0 && (
                        <div className="error-text small-text hc-booking-sheet-conflict-warning">
                          <i className="tiny">error</i>
                          <span>
                            มีชุดที่ติดจองในช่วงเวลานี้ (
                            {selectedConflicts.map((c) => c.itemCode).join(', ')}
                            ): กรุณายกเลิกหรือเปลี่ยนช่วงเวลา
                          </span>
                        </div>
                      )}

                      <div className="hc-booking-sheet-footer-row">
                        <div className="hc-booking-sheet-footer-items-summary">
                          <span className="bold small-text hc-bookings-toolbar-count">
                            {selectedItems.length > 0
                              ? `เลือกแล้ว ${selectedItems.length} ชุด`
                              : 'เลือกชุดอย่างน้อย 1 ชุด'}
                          </span>
                          {selectedItems.length > 0 && (
                            <div className="hc-booking-sheet-footer-item-chips">
                              {selectedItems.map((li) => {
                                const isLiConflict = selectedConflicts.some(
                                  (c) => c.itemId === li.itemId
                                );
                                return (
                                  <button
                                    key={li.itemId}
                                    type="button"
                                    className={`chip tiny bold no-margin hc-booking-sheet-footer-item-chip ${
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
                                  >
                                    <span>{li.itemCode}</span>
                                    <i className="micro">close</i>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="hc-booking-sheet-footer-actions">
                          <button
                            type="button"
                            className="border no-margin hc-booking-sheet-btn-round-10"
                            onClick={handleCloseCleanly}
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            className="primary no-margin hc-booking-sheet-btn-round-10"
                            data-testid="wizard-next-step-1"
                            disabled={
                              selectedItems.length === 0 ||
                              selectedConflicts.length > 0
                            }
                            onClick={handleNextStep}
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
                  <div className="hc-booking-sheet-step-content">
                    <div className="hc-booking-sheet-step2-scroll">
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
                      <article className="border tertiary-container padding no-margin">
                        <Stack orientation="column" gap="medium">
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

                        {/* Selected outfits price recap */}
                        <article className="border surface small-padding no-margin medium-text">
                          <div className="bold hc-booking-sheet-recap-title">
                            สรุปราคาแนะนำ ({selectedItems.length} ชุด, {durationDays} วัน):
                          </div>
                          <div className="hc-booking-sheet-recap-list">
                            {selectedItems.map((li) => {
                              const inv = inventoryMap.get(li.itemId);
                              const p = inv
                                ? getItemRentalPriceForDuration(inv, durationDays)
                                : 0;
                              return (
                                <div
                                  key={li.itemId}
                                  className="hc-booking-sheet-recap-row"
                                >
                                  <span className="truncate">
                                    <strong>{li.itemCode}</strong> {li.itemName}
                                  </span>
                                  <span className="bold hc-booking-card-action-btn">
                                    ฿{p.toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                            <div className="hc-booking-sheet-recap-total">
                              <span className="bold">รวมราคาแนะนำ:</span>
                              <span className="bold primary-text">
                                ฿{suggestedPrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </article>

                        <div className="grid no-margin hc-booking-sheet-pricing-grid">
                          <div className="s12 m6">
                            <div className="field label border surface no-margin">
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
                            <div className="field label border surface no-margin">
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
                      </article>

                      {/* Condition Notes per selected outfit */}
                      {selectedItems.length > 0 && (
                        <article className="border surface-container-low padding no-margin">
                          <Stack orientation="column" gap="small">
                            <span className="bold small-text">
                              หมายเหตุสภาพชุด / อุปกรณ์เสริม (ถ้ามี)
                            </span>
                            {selectedItems.map((li) => (
                              <div
                                key={li.itemId}
                                className="field small label border no-margin"
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
                        </article>
                      )}

                      {/* Booking Note Section */}
                      <div className="field textarea label border no-margin">
                        <textarea
                          id="booking-note"
                          rows={3}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder=" "
                          className="hc-booking-sheet-note-input"
                        />
                        <label htmlFor="booking-note">
                          หมายเหตุการจัดส่ง / การจอง
                        </label>
                        <i>edit_note</i>
                      </div>
                    </div>

                    {/* Step 2 Footer */}
                    <div className="hc-booking-sheet-step-footer">
                      <div className="hc-booking-sheet-footer-row">
                        <button
                          type="button"
                          className="border no-margin hc-booking-sheet-btn-round-10"
                          data-testid="wizard-prev-step-2"
                          onClick={isStep1Restricted ? handleCloseCleanly : handlePrevStep}
                        >
                          <i>arrow_back</i>
                          <span>ย้อนกลับ</span>
                        </button>

                        <button
                          type="button"
                          className="primary no-margin hc-booking-sheet-btn-round-10"
                          data-testid="wizard-next-step-2"
                          disabled={
                            !selectedCustomer ||
                            isNaN(Number(rentalPrice)) ||
                            Number(rentalPrice) < 0 ||
                            isNaN(Number(deposit)) ||
                            Number(deposit) < 0
                          }
                          onClick={handleNextStep}
                        >
                          <span>ถัดไป: ตรวจสอบ</span>
                          <i>arrow_forward</i>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ----------------- STEP 3: CONFIRMATION & REVIEW ----------------- */}
                {currentStep === 3 && (
                  <form
                    id="booking-form"
                    onSubmit={handleSubmit}
                    className="hc-booking-sheet-step3-form"
                  >
                    <div className="hc-booking-sheet-step3-scroll">
                      {/* Review Card 1: Rental Schedule */}
                      <article className="border surface-container-low padding no-margin">
                        <Stack orientation="column" gap="small">
                          <div className="row no-margin hc-booking-sheet-gap-6">
                            <i className="primary-text">event</i>
                            <span className="bold small-text">ช่วงเวลาเช่า</span>
                          </div>
                          <div className="grid no-margin hc-booking-sheet-gap-8">
                            <div className="s6">
                              <span className="hc-micro-text secondary-text">วันรับชุด</span>
                              <div className="bold">{formatDateThaiFull(startDate)}</div>
                            </div>
                            <div className="s6">
                              <span className="hc-micro-text secondary-text">
                                วันส่งคืน ({durationDays} วัน)
                              </span>
                              <div className="bold">{formatDateThaiFull(endDate)}</div>
                            </div>
                            <div className="s12">
                              <span className="hc-micro-text secondary-text">
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
                      <article className="border surface-container-low padding no-margin">
                        <Stack orientation="column" gap="small">
                          <div className="row no-margin hc-booking-sheet-gap-6">
                            <i className="primary-text">checkroom</i>
                            <span className="bold small-text">
                              ชุดที่เลือก ({selectedItems.length} ชุด)
                            </span>
                          </div>
                          <div className="column hc-booking-sheet-gap-8">
                            {selectedItems.map((li) => (
                              <article
                                key={li.itemId}
                                className="border surface small-padding no-margin hc-booking-sheet-outfit-review-item"
                              >
                                <div className="hc-booking-sheet-outfit-review-left">
                                  <span className="chip tiny primary-container bold no-margin hc-booking-sheet-outfit-code-badge">
                                    {li.itemCode}
                                  </span>
                                  <span className="small-text bold truncate">
                                    {li.itemName}
                                  </span>
                                </div>
                                {li.conditionNote && (
                                  <span className="hc-micro-text secondary-text truncate hc-booking-sheet-outfit-review-condition">
                                    หมายเหตุ: {li.conditionNote}
                                  </span>
                                )}
                              </article>
                            ))}
                          </div>
                        </Stack>
                      </article>

                      {/* Review Card 3: Customer Information */}
                      <article className="border surface-container-low padding no-margin">
                        <Stack orientation="column" gap="small">
                          <div className="row no-margin hc-booking-sheet-gap-6">
                            <i className="primary-text">person</i>
                            <span className="bold small-text">ข้อมูลลูกค้า</span>
                          </div>
                          <div className="grid no-margin hc-booking-sheet-gap-8">
                            <div className="s12 m6">
                              <span className="hc-micro-text secondary-text">ชื่อลูกค้า</span>
                              <div className="bold">{selectedCustomer?.name}</div>
                            </div>
                            <div className="s12 m6">
                              <span className="hc-micro-text secondary-text">เบอร์โทรศัพท์</span>
                              <div className="bold">{selectedCustomer?.phone}</div>
                            </div>
                            {selectedCustomer?.lineId && (
                              <div className="s12">
                                <span className="hc-micro-text secondary-text">LINE ID</span>
                                <div>{selectedCustomer.lineId}</div>
                              </div>
                            )}
                          </div>
                        </Stack>
                      </article>

                      {/* Review Card 4: Pricing & Deposit */}
                      <article className="border tertiary-container padding no-margin">
                        <Stack orientation="column" gap="small">
                          <div className="row no-margin hc-booking-sheet-gap-6">
                            <i>payments</i>
                            <span className="bold small-text">สรุปยอดชำระ</span>
                          </div>
                          <div className="column hc-booking-sheet-gap-6">
                            <div className="hc-booking-sheet-summary-row">
                              <span>ราคาเช่ารวม:</span>
                              <span className="bold">
                                ฿{Number(rentalPrice).toLocaleString()}
                              </span>
                            </div>
                            <div className="hc-booking-sheet-summary-row">
                              <span>เงินมัดจำ:</span>
                              <span className="bold">
                                ฿{Number(deposit).toLocaleString()}
                                {depositRefunded ? ' (โอนคืนแล้ว)' : ' (รอโอนคืน)'}
                              </span>
                            </div>
                            <div className="hc-booking-sheet-summary-total-row">
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
                        <article className="border surface-container-low padding no-margin">
                          <Stack orientation="column" gap="tiny">
                            <span className="hc-micro-text secondary-text bold">
                              หมายเหตุการจัดส่ง / การจอง:
                            </span>
                            <p className="no-margin small-text">{note}</p>
                          </Stack>
                        </article>
                      )}
                    </div>

                    {/* Step 3 Footer */}
                    <div className="hc-booking-sheet-step-footer">
                      <div className="hc-booking-sheet-footer-row">
                        <button
                          type="button"
                          className="border no-margin hc-booking-sheet-btn-round-10"
                          data-testid="wizard-prev-step-3"
                          disabled={submitting}
                          onClick={handlePrevStep}
                        >
                          <i>arrow_back</i>
                          <span>ย้อนกลับ</span>
                        </button>

                        <button
                          type="submit"
                          className="primary no-margin hc-booking-sheet-step3-submit"
                          data-testid="wizard-submit-booking"
                          disabled={submitting}
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
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* ----------------- MODE === 'EDIT' | 'VIEW': SINGLE SHEET LAYOUT ----------------- */
              <>
                <form
                  id="booking-form"
                  onSubmit={handleSubmit}
                  className="hc-booking-sheet-edit-form"
                >
                  <fieldset
                    disabled={mode === 'view'}
                    className="no-border no-padding no-margin hc-booking-sheet-fieldset"
                  >
                  {/* 1. Dates & Duration Section */}
                  <article className="border surface-container-low padding no-margin">
                    <Stack orientation="column" gap="medium">
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

                      <div className="grid no-margin hc-booking-sheet-dates-grid">
                        <div className="s12 m4">
                          <div className="field label border no-margin">
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
                          <div className="field label border no-margin">
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
                          <div className="field label border no-margin">
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
                  </article>

                  {/* 2. Customer Picker Section */}
                  <Stack orientation="column" gap="small">
                    <span className="bold small-text">ข้อมูลลูกค้า *</span>
                    <CustomerPicker
                      customers={customers}
                      selectedCustomer={selectedCustomer}
                      onSelectCustomer={setSelectedCustomer}
                      onCreateCustomer={handleCreateCustomerInline}
                      disabled={mode === 'view'}
                    />
                  </Stack>

                  {/* 2.5 Booking Status & Transaction Dates (Edit mode) */}
                  <article className="border surface-container-low padding no-margin">
                    <Stack orientation="column" gap="small">
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
                          disabled={mode === 'view' || Boolean(subsequentSheetBlock)}
                          onChange={(e) =>
                            handleSheetStatusChange(
                              e.target.value as BookingItemStatus
                            )
                          }
                          className="hc-booking-sheet-status-select"
                        >
                          {BOOKING_STATUS_ORDER.map((st) => (
                            <option key={st} value={st}>
                              {BOOKING_STATUS_META[st].label}
                            </option>
                          ))}
                        </select>
                      </Stack>

                      {subsequentSheetBlock && (
                        <article className="border error-container small-padding no-margin small-text">
                          ไม่สามารถแก้ไขสถานะในวันที่{' '}
                          {formatDateThaiShort(effectiveSheetDate)} ได้ เนื่องจากวันที่{' '}
                          <strong>
                            {formatDateThaiShort(subsequentSheetBlock.date)}
                          </strong>{' '}
                          เปลี่ยนเป็นสถานะ "
                          {BOOKING_STATUS_META[subsequentSheetBlock.status].label}"
                          แล้ว
                        </article>
                      )}

                      {pendingStatusChange && (
                        <article className="border tertiary-container small-padding no-margin">
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
                                className="border small no-margin"
                                onClick={() => setPendingStatusChange(null)}
                              >
                                ยกเลิก
                              </button>
                              <button
                                type="button"
                                className="primary small no-margin"
                                onClick={confirmSheetStatusChange}
                              >
                                ยืนยัน
                              </button>
                            </Stack>
                          </Stack>
                        </article>
                      )}

                      {/* Transaction History Chips */}
                      <Stack orientation="row" align="center" gap="tiny" wrap>
                        {BOOKING_STATUS_ORDER.filter(
                          (st) => Boolean(transactionDates[st])
                        ).map((st) => (
                          <span
                            key={st}
                            className="chip tiny border no-margin hc-micro-text hc-booking-sheet-history-chip"
                          >
                            {BOOKING_STATUS_META[st].label}:{' '}
                            {formatDateThaiShort(transactionDates[st]!)}
                          </span>
                        ))}
                      </Stack>
                    </Stack>
                  </article>

                  {/* 3. Multi-Item Selector Section */}
                  <article className="border surface-container-low padding no-margin">
                    <Stack orientation="column" gap="medium">
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
                            <article
                              key={li.itemId}
                              className="border surface small-padding no-margin"
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

                                  {mode !== 'view' && (
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
                                  )}
                                </Stack>

                                <div className="field small label border no-margin">
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
                            </article>
                          ))}
                        </Stack>
                      )}

                      {/* Search & Pick Inventory Items */}
                      {mode !== 'view' && (
                        <>
                          <div className="field small label border no-margin">
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

                          <article className="border surface small-padding no-margin hc-booking-sheet-edit-outfit-picker">
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
                                  <InventoryCard
                                    key={invItem.id}
                                    item={invItem}
                                    size="sm"
                                    variant="outlined"
                                    selected={isSelected}
                                    hasConflict={hasConflict}
                                    hideDefaultMeta
                                    className={getOutfitCardClass(isSelected, hasConflict)}
                                    noteSlot={
                                      hasConflict ? (
                                        <span className="hc-micro-text error-text bold">
                                          ติดจองช่วงเวลานี้ ({conflicts[0].customerName})
                                        </span>
                                      ) : undefined
                                    }
                                    trailingActionSlot={
                                      <button
                                        type="button"
                                        className={`small no-margin ${isSelected ? 'primary' : 'border'}`}
                                        disabled={hasConflict && !isSelected}
                                        onClick={() => handleToggleItem(invItem)}
                                        aria-label={
                                          isSelected
                                            ? `ยกเลิกเลือก ${invItem.code}`
                                            : `เลือกชุด ${invItem.code}`
                                        }
                                      >
                                        {renderEditOutfitButtonContent(isSelected, hasConflict)}
                                      </button>
                                    }
                                  />
                                );
                              })}
                            </Stack>
                          </article>
                        </>
                      )}
                    </Stack>
                  </article>

                  {/* 4. Pricing & Deposit Section */}
                  <article className="border tertiary-container padding no-margin">
                    <Stack orientation="column" gap="medium">
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
                        {mode !== 'view' && priceManuallyEdited && (
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

                      <div className="grid no-margin hc-booking-sheet-dates-grid">
                        <div className="s12 m6">
                          <div className="field label border surface no-margin">
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
                          <div className="field label border surface no-margin">
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
                  </article>

                  {/* 5. Note Section */}
                  <div className="field textarea label border no-margin">
                    <textarea
                      id="booking-note"
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder=" "
                      className="hc-booking-sheet-note-input"
                    />
                    <label htmlFor="booking-note">หมายเหตุการจัดส่ง / การจอง</label>
                    <i>edit_note</i>
                  </div>
                  </fieldset>
                </form>

                {/* 6. Delete Confirmation (Edit mode only) */}
                {mode === 'edit' && confirmDelete && (
                  <article className="border error-container margin-top margin-bottom hc-booking-sheet-edit-delete-banner">
                    <div className="vertical hc-booking-sheet-delete-confirm-content">
                      <div className="row no-margin">
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
                      <div className="row no-margin right-align hc-booking-sheet-delete-confirm-content">
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

                {/* Footer Action Buttons for View or Edit Mode */}
                {mode === 'view' ? (
                  <div className="row no-margin hc-booking-sheet-edit-footer">
                    <div className="max" />
                    <button
                      type="button"
                      className="primary round no-margin"
                      onClick={handleCloseCleanly}
                    >
                      ปิด
                    </button>
                  </div>
                ) : (
                  <div className="row no-margin hc-booking-sheet-edit-footer">
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
                      className="primary round no-margin hc-booking-sheet-edit-submit-btn"
                      disabled={submitting}
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
                )}
              </>
            )}
          </>
        )}
      </Modal>
    );
  };
