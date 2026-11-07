import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import {
  BOOKING_STATUS_META,
  BOOKING_STATUS_ORDER,
  isBookingFullyReturned,
  getBookingStatusOnDate,
  getItemStatusOnDate,
  getLatestBookingStatus,
  getEffectiveBookingStatus,
  getSubsequentStatusBlock,
  getTodayISO,
  addDaysISO,
  formatDateThaiFull,
  type Booking,
  type BookingLineItem,
  type BookingItemStatus,
} from '../types/booking';
import type { InventoryItem } from '../types/inventory';
import type { NewBookingInput } from '../services/bookings';
import { useBookings } from '../hooks/useBookings';
import { useCustomers } from '../hooks/useCustomers';
import { useInventory } from '../hooks/useInventory';
import { BookingCard } from '../components/BookingCard';
import { BookingInventoryCard } from '../components/BookingInventoryCard';
import { BookingDateBar } from '../components/BookingDateBar';
import { BookingCalendar } from '../components/BookingCalendar';
import { BookingSheet } from '../components/BookingSheet';
import { EmptyState } from '../components/EmptyState';
import { Stack } from '../components/Stack';
import { Skeleton } from '../components/Skeleton';
import {
  Modal,
  Collapsible,
  HeaderToolbar,
  HeaderToolbarStickyWrapper,
} from '../common/components';
import './BookingsPage.css';

// Mapping for solid filled status badges on section counts
const STATUS_FILLED_CLASS_MAP: Record<BookingItemStatus | 'available', string> = {
  available: 'hc-status-badge-filled-available',
  reserved: 'hc-status-badge-filled-reserved',
  pending_delivery: 'tertiary',
  delivered: 'primary',
  pending_return: 'error',
  in_laundry: 'hc-status-badge-filled-laundry',
  returned: 'hc-status-badge-filled-available',
};

interface SheetState {
  isOpen: boolean;
  mode: 'add' | 'edit' | 'view';
  booking?: Booking | null;
}

interface PendingStatusConfirm {
  booking: Booking;
  itemId?: string | null;
  currentStatus: BookingItemStatus;
  nextStatus: BookingItemStatus;
  targetDate: string;
}

function findItemBooking(
  item: InventoryItem,
  bookings: Booking[],
  selectedDate: string,
  isAllDates: boolean
): {
  booking: Booking | null;
  lineItem: BookingLineItem | null;
  status: BookingItemStatus | 'available';
} {
  const itemBookings = bookings.filter((b) =>
    b.items.some(
      (li) =>
        li.itemId === item.id ||
        li.itemCode.toLowerCase() === item.code.toLowerCase()
    )
  );

  if (itemBookings.length === 0) {
    return { booking: null, lineItem: null, status: 'available' };
  }

  if (!isAllDates) {
    const matching = itemBookings.find((b) => {
      const lineItem = b.items.find(
        (li) =>
          li.itemId === item.id ||
          li.itemCode.toLowerCase() === item.code.toLowerCase()
      );
      if (!lineItem) return false;
      const itemCleaningEnd =
        lineItem.status === 'returned' && lineItem.cleaningEndDate
          ? lineItem.cleaningEndDate
          : b.cleaningEndDate;
      return selectedDate >= b.startDate && selectedDate <= itemCleaningEnd;
    });

    if (matching) {
      const lineItem = matching.items.find(
        (li) =>
          li.itemId === item.id ||
          li.itemCode.toLowerCase() === item.code.toLowerCase()
      );
      if (lineItem) {
        const status = getItemStatusOnDate(matching, lineItem, selectedDate);
        return { booking: matching, lineItem, status };
      }
    }
    return { booking: null, lineItem: null, status: 'available' };
  } else {
    // isAllDates: check for active booking
    const active = itemBookings.find((b) => {
      const lineItem = b.items.find(
        (li) =>
          li.itemId === item.id ||
          li.itemCode.toLowerCase() === item.code.toLowerCase()
      );
      return lineItem && lineItem.status !== 'returned' && !isBookingFullyReturned(b);
    });

    if (active) {
      const lineItem = active.items.find(
        (li) =>
          li.itemId === item.id ||
          li.itemCode.toLowerCase() === item.code.toLowerCase()
      );
      if (lineItem) {
        return {
          booking: active,
          lineItem,
          status: getLatestBookingStatus(active),
        };
      }
    }

    const anyBooking = itemBookings[0];
    const lineItem = anyBooking.items.find(
      (li) =>
        li.itemId === item.id ||
        li.itemCode.toLowerCase() === item.code.toLowerCase()
    );
    if (lineItem && getLatestBookingStatus(anyBooking) === 'returned') {
      return { booking: anyBooking, lineItem, status: 'returned' };
    }

    return { booking: null, lineItem: null, status: 'available' };
  }
}

function matchesBookingSearch(booking: Booking, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const qDigits = q.replace(/[\s-]/g, '');

  return (
    booking.customerName.toLowerCase().includes(q) ||
    (booking.customerPhone
      ? booking.customerPhone.replace(/[\s-]/g, '').includes(qDigits)
      : false) ||
    (booking.customerLineId
      ? booking.customerLineId.toLowerCase().includes(q)
      : false) ||
    booking.items.some(
      (li) =>
        li.itemCode.toLowerCase().includes(q) ||
        li.itemName.toLowerCase().includes(q)
    )
  );
}

interface BookingsEmptyStateParams {
  searchQuery: string;
  isAllDates: boolean;
  selectedDate: string;
  onOpenAdd: () => void;
  onClearSearch: () => void;
  onViewAllDates: () => void;
}

function getBookingsEmptyStateProps(params: BookingsEmptyStateParams) {
  const {
    searchQuery,
    isAllDates,
    selectedDate,
    onOpenAdd,
    onClearSearch,
    onViewAllDates,
  } = params;

  if (searchQuery) {
    return {
      icon: 'search_off',
      title: 'ไม่พบชุดหรือรายการจองที่ตรงกับเงื่อนไขการค้นหา',
      description: 'ลองค้นหาด้วยชื่อลูกค้า เบอร์โทรศัพท์ หรือรหัสชุดอื่น',
      actionIcon: 'add',
      actionText: 'สร้างการจองใหม่',
      onAction: onOpenAdd,
      secondaryActionIcon: 'close',
      secondaryActionText: 'ล้างการค้นหา',
      onSecondaryAction: onClearSearch,
    };
  }

  if (!isAllDates) {
    return {
      icon: 'event_note',
      title: 'ไม่มีคิวจองในวันที่เลือก',
      description: `ไม่มีชุดหรือรายการจองในวันที่ ${formatDateThaiFull(selectedDate)}`,
      actionIcon: 'add',
      actionText: 'สร้างการจองใหม่',
      onAction: onOpenAdd,
      secondaryActionIcon: 'calendar_month',
      secondaryActionText: 'ดูการจองทุกวัน',
      onSecondaryAction: onViewAllDates,
    };
  }

  return {
    icon: 'event_note',
    title: 'ไม่มีชุดในระบบ',
    description: 'กดปุ่มด้านล่างเพื่อสร้างรายการจองชุดใหม่',
    actionIcon: 'add',
    actionText: 'สร้างการจองใหม่',
    onAction: onOpenAdd,
  };
}

export const BookingsPage: React.FC = () => {
  const {
    bookings,
    loading,
    error,
    addBooking,
    updateBooking,
    updateBookingStatus,
    updateItemStatus,
    deleteBooking,
  } = useBookings();
  const { customers, addCustomer } = useCustomers();
  const { items: inventoryItems } = useInventory();

  const today = useMemo(() => getTodayISO(), []);
  const [selectedDate, setSelectedDate] = useState<string>(() => today);
  const [isAllDates, setIsAllDates] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(() => new Set());
  const [selectedDurationDays, setSelectedDurationDays] = useState<number>(3);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarSheetOpen, setCalendarSheetOpen] = useState(false);
  const [pendingStatusConfirm, setPendingStatusConfirm] =
    useState<PendingStatusConfirm | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchFabRef = useRef<HTMLButtonElement>(null);
  const scrollPosOnToggleRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  const handleOpenSearch = () => {
    scrollPosOnToggleRef.current = window.scrollY;
    setSearchOpen(true);
  };

  const handleCloseSearch = () => {
    scrollPosOnToggleRef.current = window.scrollY;
    setSearchOpen(false);
  };

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const targetY = scrollPosOnToggleRef.current;

    if (searchOpen) {
      searchInputRef.current?.focus({ preventScroll: true });
    } else {
      searchFabRef.current?.focus({ preventScroll: true });
    }

    if (targetY !== null) {
      if (window.scrollY !== targetY) {
        window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
      }

      const rafId = requestAnimationFrame(() => {
        if (window.scrollY !== targetY) {
          window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
        }
      });

      scrollPosOnToggleRef.current = null;
      return () => cancelAnimationFrame(rafId);
    }
  }, [searchOpen]);

  const [sheetState, setSheetState] = useState<SheetState>({
    isOpen: false,
    mode: 'add',
    booking: null,
  });

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

  // Inventory-centric items list with booking status on selected date
  const itemBookingEntries = useMemo(() => {
    return inventoryItems.map((item) => {
      const result = findItemBooking(item, bookings, selectedDate, isAllDates);
      return { item, ...result };
    });
  }, [inventoryItems, bookings, selectedDate, isAllDates]);

  const filteredItemEntries = useMemo(() => {
    if (!searchQuery.trim()) {
      return itemBookingEntries;
    }

    const q = searchQuery.trim().toLowerCase();
    const qDigits = q.replace(/[\s-]/g, '');

    return itemBookingEntries.filter((entry) => {
      const item = entry.item;
      const b = entry.booking;

      const matchItem =
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.color && item.color.toLowerCase().includes(q));

      const matchBooking =
        b &&
        (b.customerName.toLowerCase().includes(q) ||
          (b.customerPhone &&
            b.customerPhone.replace(/[\s-]/g, '').includes(qDigits)) ||
          (b.customerLineId && b.customerLineId.toLowerCase().includes(q)));

      return matchItem || matchBooking;
    });
  }, [itemBookingEntries, searchQuery]);

  // Available items for the 'ว่าง (พร้อมเช่า)' section
  const availableEntries = useMemo(() => {
    return filteredItemEntries.filter((entry) => entry.status === 'available');
  }, [filteredItemEntries]);

  // Filtered bookings list for non-ว่าง sections
  const filteredBookings = useMemo(() => {
    const byDate = isAllDates
      ? bookings.filter((b) => !isBookingFullyReturned(b))
      : bookings.filter((b) => {
          const effectiveCleaningEnd =
            isBookingFullyReturned(b) && b.transactionDates?.returned
              ? addDaysISO(b.transactionDates.returned, 2)
              : b.cleaningEndDate;
          return (
            selectedDate >= b.startDate && selectedDate <= effectiveCleaningEnd
          );
        });

    const bySearch = byDate.filter((b) => matchesBookingSearch(b, searchQuery));

    return [...bySearch].sort((a, b) => {
      const cmp = a.startDate.localeCompare(b.startDate);
      if (cmp !== 0) return cmp;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [bookings, isAllDates, selectedDate, searchQuery]);

  // Group bookings by status for collapsible sections
  const groupedBookings = useMemo(() => {
    const groups: {
      status: BookingItemStatus;
      label: string;
      chipClass: string;
      filledBadgeClass: string;
      bookings: typeof filteredBookings;
    }[] = [];

    for (const st of BOOKING_STATUS_ORDER) {
      const bList = filteredBookings.filter((b) => {
        const computed = getEffectiveBookingStatus(b, selectedDate, isAllDates);
        return computed === st;
      });

      if (bList.length > 0) {
        const meta = BOOKING_STATUS_META[st];
        groups.push({
          status: st,
          label: meta.label,
          chipClass: meta.chipClass,
          filledBadgeClass: STATUS_FILLED_CLASS_MAP[st],
          bookings: bList,
        });
      }
    }

    return groups;
  }, [filteredBookings, selectedDate, isAllDates]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setIsAllDates(false);
    setSelectedItemIds(new Set());
  };

  const handleToggleSelectItem = (item: InventoryItem) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const handleBookSelected = () => {
    const selectedItemsList = inventoryItems.filter((item) =>
      selectedItemIds.has(item.id)
    );
    if (selectedItemsList.length === 0) return;

    const start = isAllDates ? today : selectedDate;
    const end = addDaysISO(start, selectedDurationDays - 1);
    const cleaning = addDaysISO(end, 2);

    const defaultPrice = selectedItemsList.reduce((sum, item) => {
      const sorted = [...(item.rentalPrices ?? [])].sort(
        (a, b) => a.durationDays - b.durationDays
      );
      const exact = sorted.find((t) => t.durationDays === selectedDurationDays);
      if (exact) return sum + exact.price;
      const lowerOrEqual = [...sorted]
        .reverse()
        .find((t) => t.durationDays <= selectedDurationDays);
      return sum + ((lowerOrEqual ?? sorted[0])?.price ?? 0);
    }, 0);

    setSheetState({
      isOpen: true,
      mode: 'add',
      booking: {
        id: '',
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerLineId: null,
        startDate: start,
        endDate: end,
        cleaningEndDate: cleaning,
        durationDays: selectedDurationDays,
        rentalPrice: defaultPrice,
        deposit: 0,
        depositRefunded: false,
        note: '',
        createdAt: '',
        updatedAt: '',
        transactionDates: { reserved: start < today ? start : today },
        items: selectedItemsList.map((item) => ({
          itemId: item.id,
          itemCode: item.code,
          itemName: item.name,
          itemImageUrl: item.imageUrl,
        })),
      },
    });
  };

  const handleOpenAdd = () => {
    if (selectedItemIds.size > 0) {
      handleBookSelected();
      return;
    }
    const start = isAllDates ? today : selectedDate;
    const end = addDaysISO(start, selectedDurationDays - 1);
    const cleaning = addDaysISO(end, 2);
    setSheetState({
      isOpen: true,
      mode: 'add',
      booking: {
        id: '',
        customerId: '',
        customerName: '',
        customerPhone: '',
        startDate: start,
        endDate: end,
        cleaningEndDate: cleaning,
        durationDays: selectedDurationDays,
        rentalPrice: 0,
        deposit: 0,
        depositRefunded: false,
        createdAt: '',
        updatedAt: '',
        transactionDates: { reserved: start < today ? start : today },
        items: [],
      },
    });
  };

  const handleReserveItem = (item: InventoryItem) => {
    const start = isAllDates ? today : selectedDate;
    const end = addDaysISO(start, selectedDurationDays - 1);
    const cleaning = addDaysISO(end, 2);
    const sorted = [...(item.rentalPrices ?? [])].sort(
      (a, b) => a.durationDays - b.durationDays
    );
    const exact = sorted.find((t) => t.durationDays === selectedDurationDays);
    const lowerOrEqual = [...sorted]
      .reverse()
      .find((t) => t.durationDays <= selectedDurationDays);
    const defaultPrice = (exact ?? lowerOrEqual ?? sorted[0])?.price ?? 0;

    setSheetState({
      isOpen: true,
      mode: 'add',
      booking: {
        id: '',
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerLineId: null,
        startDate: start,
        endDate: end,
        cleaningEndDate: cleaning,
        durationDays: selectedDurationDays,
        rentalPrice: defaultPrice,
        deposit: 0,
        depositRefunded: false,
        note: '',
        createdAt: '',
        updatedAt: '',
        transactionDates: { reserved: start < today ? start : today },
        items: [
          {
            itemId: item.id,
            itemCode: item.code,
            itemName: item.name,
            itemImageUrl: item.imageUrl,
          },
        ],
      },
    });
  };

  const handleOpenEdit = (booking: Booking) => {
    setSheetState({
      isOpen: true,
      mode: 'edit',
      booking,
    });
  };

  const handleOpenView = (booking: Booking) => {
    setSheetState({
      isOpen: true,
      mode: 'view',
      booking,
    });
  };

  const handleCloseSheet = () => {
    setSheetState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSubmitSheet = async (data: NewBookingInput) => {
    if (sheetState.mode === 'edit' && sheetState.booking) {
      await updateBooking(sheetState.booking.id, data);
    } else {
      await addBooking(data);
    }
    setSelectedItemIds(new Set());
  };

  const handleDeleteSheet = async (id: string) => {
    await deleteBooking(id);
  };

  const handleAdvanceBookingStatus = async (
    bookingId: string,
    nextStatus: BookingItemStatus,
    effectiveDate?: string
  ) => {
    const targetDate = effectiveDate ?? (isAllDates ? today : selectedDate);
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      const block = getSubsequentStatusBlock(booking, targetDate, nextStatus);
      if (block) {
        return;
      }
      if (targetDate !== today && nextStatus !== 'reserved') {
        setPendingStatusConfirm({
          booking,
          itemId: null,
          currentStatus: getBookingStatusOnDate(booking, targetDate),
          nextStatus,
          targetDate,
        });
        return;
      }
    }
    await updateBookingStatus(bookingId, nextStatus, targetDate);
  };

  const handleAdvanceItemStatus = async (
    bookingId: string,
    itemId: string,
    nextStatus: BookingItemStatus,
    effectiveDate?: string
  ) => {
    const targetDate = effectiveDate ?? (isAllDates ? today : selectedDate);
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      const block = getSubsequentStatusBlock(booking, targetDate, nextStatus);
      if (block) {
        return;
      }
      if (targetDate !== today && nextStatus !== 'reserved') {
        setPendingStatusConfirm({
          booking,
          itemId,
          currentStatus: getBookingStatusOnDate(booking, targetDate),
          nextStatus,
          targetDate,
        });
        return;
      }
    }
    await updateItemStatus(bookingId, itemId, nextStatus, undefined, targetDate);
  };

  const handleConfirmPendingStatus = async () => {
    if (!pendingStatusConfirm) return;
    const { booking, itemId, nextStatus, targetDate } = pendingStatusConfirm;
    setPendingStatusConfirm(null);
    if (itemId) {
      await updateItemStatus(booking.id, itemId, nextStatus, undefined, targetDate);
    } else {
      await updateBookingStatus(booking.id, nextStatus, targetDate);
    }
  };

  const handleToggleDepositRefunded = async (booking: Booking) => {
    await updateBooking(booking.id, {
      depositRefunded: !booking.depositRefunded,
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div
          className="grid"
          aria-busy="true"
          aria-label="กำลังโหลดรายการจอง"
        >
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="s12 m6">
              <article className="border round surface hc-medium-padding no-margin">
                <Stack orientation="column" gap="small">
                  <Skeleton shape="round" className="hc-bookings-skeleton-title" />
                  <Skeleton shape="round" className="hc-bookings-skeleton-body" />
                  <Skeleton shape="round" className="hc-bookings-skeleton-footer" />
                </Stack>
              </article>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <article className="border error-container round margin">
          <div className="row">
            <i className="error-text">error</i>
            <div className="max">
              <h6 className="bold no-margin error-text">
                เกิดข้อผิดพลาดในการโหลดข้อมูลการจอง
              </h6>
              <p className="no-margin secondary-text">{error.message}</p>
            </div>
          </div>
        </article>
      );
    }

    const hasAnyContent = availableEntries.length > 0 || groupedBookings.length > 0;

    if (!hasAnyContent) {
      return (
        <EmptyState
          {...getBookingsEmptyStateProps({
            searchQuery,
            isAllDates,
            selectedDate,
            onOpenAdd: handleOpenAdd,
            onClearSearch: () => setSearchQuery(''),
            onViewAllDates: () => {
              setIsAllDates(true);
              setSelectedItemIds(new Set());
            },
          })}
        />
      );
    }

    return (
      <div className="hc-bookings-status-sections">
        {/* Non-ว่าง Sections: Grouped Booking Cards (collapsed by default) */}
        {groupedBookings.map((group) => {
          return (
            <Collapsible
              key={group.status}
              testId={`collapsible-status-${group.status}`}
              className="hc-bookings-status-collapsible"
              variant="plain"
              title={group.label}
              defaultOpen={false}
              statusChipClass={group.filledBadgeClass}
              badgeSlot={
                <span
                  className="bold hc-collapsible-chip-count"
                  data-testid={`badge-count-${group.status}`}
                >
                  {group.bookings.length}
                </span>
              }
            >
              <div className="grid">
                {group.bookings.map((booking) => (
                  <div key={booking.id} className="s12 m12 l6">
                    <BookingCard
                      booking={booking}
                      selectedDate={selectedDate}
                      isAllDates={isAllDates}
                      inventoryMap={inventoryMap}
                      onEdit={handleOpenEdit}
                      onView={handleOpenView}
                      onAdvanceItemStatus={handleAdvanceItemStatus}
                      onAdvanceBookingStatus={handleAdvanceBookingStatus}
                      onToggleDepositRefunded={handleToggleDepositRefunded}
                    />
                  </div>
                ))}
              </div>
            </Collapsible>
          );
        })}

        {/* Bottom-most Section: Available (ว่าง - พร้อมเช่า) expanded by default */}
        {availableEntries.length > 0 && (
          <Collapsible
            key="available"
            testId="collapsible-status-available"
            className="hc-bookings-status-collapsible"
            variant="plain"
            title="ว่าง (พร้อมเช่า)"
            defaultOpen={true}
            statusChipClass="hc-status-badge-filled-available"
            badgeSlot={
              <span
                className="bold hc-collapsible-chip-count"
                data-testid="badge-count-available"
              >
                {availableEntries.length}
              </span>
            }
          >
            {/* Duration Selector Filter Bar inside 'ว่าง' Section */}
            <div
              className="hc-bookings-duration-filter-bar"
              role="group"
              aria-label="เลือกระยะเวลาเช่า"
            >
              <span className="hc-bookings-duration-filter-label">ระยะเวลาเช่า:</span>
              {[1, 3, 5].map((days) => (
                <button
                  key={days}
                  type="button"
                  className={`chip small no-margin hc-bookings-duration-chip ${
                    selectedDurationDays === days ? 'primary' : 'border'
                  }`}
                  onClick={() => setSelectedDurationDays(days)}
                  aria-pressed={selectedDurationDays === days}
                  data-testid={`duration-filter-${days}`}
                >
                  {days} วัน
                </button>
              ))}
            </div>

            <div className="grid">
              {availableEntries.map((entry) => (
                <div key={entry.item.id} className="s12 m12 l6">
                  <BookingInventoryCard
                    item={entry.item}
                    booking={entry.booking}
                    lineItem={entry.lineItem}
                    selectedDate={selectedDate}
                    isAllDates={isAllDates}
                    selectedDurationDays={selectedDurationDays}
                    isSelected={selectedItemIds.has(entry.item.id)}
                    onToggleSelect={handleToggleSelectItem}
                    onReserve={handleReserveItem}
                    onEditBooking={handleOpenEdit}
                    onViewBooking={handleOpenView}
                    onAdvanceItemStatus={handleAdvanceItemStatus}
                  />
                </div>
              ))}
            </div>
          </Collapsible>
        )}
      </div>
    );
  };

  return (
    <div className="bookings-page">
      {/* Top Bar Sticky Wrapper: Date Navigation or Dedicated Search */}
      <HeaderToolbarStickyWrapper>
        <div className="hc-bookings-top-row">
          {!searchOpen ? (
            <>
              <div className="hc-bookings-top-main">
                <BookingDateBar
                  sticky={false}
                  selectedDate={selectedDate}
                  today={today}
                  isAllDates={isAllDates}
                  calendarSheetOpen={calendarSheetOpen}
                  onDateChange={handleDateChange}
                  onCalendarClick={() => setCalendarSheetOpen(true)}
                />
              </div>

              <button
                ref={searchFabRef}
                type="button"
                className="circle large blur border no-margin hc-top-fab hc-search-fab"
                onClick={handleOpenSearch}
                aria-label="ค้นหา"
                title="ค้นหา"
                data-testid="bookings-search-fab"
              >
                <i aria-hidden="true">search</i>
                {searchQuery.trim() && (
                  <span
                    className="badge circle tiny primary hc-search-active-dot"
                    data-testid="search-active-dot"
                  />
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="circle large blur border no-margin hc-top-fab hc-back-fab"
                onClick={handleCloseSearch}
                aria-label="กลับสู่แถบวันที่"
                title="กลับสู่แถบวันที่"
                data-testid="bookings-search-back-fab"
              >
                <i aria-hidden="true">chevron_right</i>
              </button>

              <div className="hc-bookings-top-search">
                <HeaderToolbar
                  sticky={false}
                  testId="bookings-search-bar"
                  className="hc-bookings-search-toolbar"
                >
                  <i
                    className="small hc-search-leading-icon"
                    aria-hidden="true"
                  >
                    search
                  </i>
                  <input
                    ref={searchInputRef}
                    type="search"
                    className="hc-bookings-search-input"
                    placeholder="ค้นหาชื่อ, เบอร์, รหัสชุด..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        handleCloseSearch();
                      }
                    }}
                    aria-label="ค้นหาการจองหรือชุด"
                    data-testid="bookings-search-input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="circle small transparent no-margin hc-search-clear-btn"
                      onClick={() => {
                        setSearchQuery('');
                        searchInputRef.current?.focus({ preventScroll: true });
                      }}
                      aria-label="ล้างการค้นหา"
                      title="ล้างการค้นหา"
                      data-testid="bookings-search-clear-btn"
                    >
                      <i aria-hidden="true">close</i>
                    </button>
                  )}
                </HeaderToolbar>
              </div>
            </>
          )}
        </div>
      </HeaderToolbarStickyWrapper>

      {/* Main Content Area */}
      {renderContent()}

      {/* Bottom Spacing for Floating Bar */}
      <div className="extra-space"></div>
      <div className="large-space"></div>

      {/* Dynamic Extended 'Book N Outfits' FAB */}
      {selectedItemIds.size > 0 && (
        <button
          type="button"
          className="fixed bottom right round extra primary medium-elevate margin front hc-booking-action-fab"
          onClick={handleBookSelected}
          aria-label={`จอง ${selectedItemIds.size} ชุด`}
          title={`จอง ${selectedItemIds.size} ชุด`}
          data-testid="bookings-action-fab"
        >
          <i aria-hidden="true">shopping_bag</i>
          <span>จอง {selectedItemIds.size} ชุด</span>
        </button>
      )}

      {/* Past / Future Status Change Confirmation Dialog */}
      {pendingStatusConfirm && (
        <Modal
          visible={Boolean(pendingStatusConfirm)}
          variant="floating"
          onClose={() => setPendingStatusConfirm(null)}
          overlayClassName="hc-bookings-confirm-overlay"
          className="round hc-medium-padding hc-bookings-confirm-dialog"
          ariaLabel="ยืนยันการเปลี่ยนสถานะต่างวัน"
          testId="confirm-status-date-dialog"
        >
          <Stack orientation="column" gap="medium">
            <Stack orientation="row" align="center" gap="small">
              <i className="tertiary-text">warning</i>
              <h6 className="bold no-margin">
                ยืนยันการเปลี่ยนสถานะ
                {pendingStatusConfirm.targetDate < today
                  ? 'ย้อนหลัง'
                  : 'ล่วงหน้า'}
              </h6>
            </Stack>

            <p className="small-text no-margin">
              คุณกำลังเปลี่ยนสถานะของการจองลูกค้า{' '}
              <strong>{pendingStatusConfirm.booking.customerName}</strong>{' '}
              ในวันที่{' '}
              <strong>
                {formatDateThaiFull(pendingStatusConfirm.targetDate)}
              </strong>{' '}
              (ไม่ใช่วันปัจจุบัน) จาก{' '}
              <strong>
                "{BOOKING_STATUS_META[pendingStatusConfirm.currentStatus].label}"
              </strong>{' '}
              เป็น{' '}
              <strong>
                "{BOOKING_STATUS_META[pendingStatusConfirm.nextStatus].label}"
              </strong>
            </p>

            <Stack orientation="row" gap="small" justify="flex-end">
              <button
                type="button"
                className="border round no-margin"
                onClick={() => setPendingStatusConfirm(null)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="primary round no-margin"
                data-testid="confirm-status-date-submit"
                onClick={handleConfirmPendingStatus}
              >
                ยืนยันเปลี่ยนสถานะ
              </button>
            </Stack>
          </Stack>
        </Modal>
      )}

      {/* Booking Calendar Date Picker Bottom Sheet */}
      <BookingCalendar
        isOpen={calendarSheetOpen}
        selectedDate={isAllDates ? today : selectedDate}
        today={today}
        bookings={bookings}
        onSelectDate={handleDateChange}
        onClose={() => setCalendarSheetOpen(false)}
      />

      {/* Booking Add / Edit / View Sheet */}
      <BookingSheet
        isOpen={sheetState.isOpen}
        mode={sheetState.mode}
        booking={sheetState.booking}
        bookings={bookings}
        selectedDate={isAllDates ? today : selectedDate}
        inventoryItems={inventoryItems}
        customers={customers}
        onAddCustomer={addCustomer}
        onClose={handleCloseSheet}
        onSubmit={handleSubmitSheet}
        onDelete={sheetState.mode === 'edit' ? handleDeleteSheet : undefined}
        onEditBooking={handleOpenEdit}
      />
    </div>
  );
};
