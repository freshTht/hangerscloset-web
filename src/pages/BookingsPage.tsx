import React, { useState, useMemo, useRef } from 'react';
import {
  BOOKING_STATUS_META,
  isBookingFullyReturned,
  getBookingStatusOnDate,
  getLatestBookingStatus,
  getEffectiveBookingStatus,
  getSubsequentStatusBlock,
  getTodayISO,
  addDaysISO,
  formatDateThaiShort,
  formatDateThaiShortWithYear,
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
import { BookingCalendar } from '../components/BookingCalendar';
import { BookingSheet } from '../components/BookingSheet';
import {
  BookingFilterSheet,
  FILTER_TABS,
  SORT_OPTIONS,
  type BookingFilterTab,
  type BookingSortKey,
} from '../components/BookingFilterSheet';
import { EmptyState } from '../components/EmptyState';
import { Stack } from '../components/Stack';

export type { BookingFilterTab, BookingSortKey };
export { FILTER_TABS, SORT_OPTIONS };
export type BookingViewMode = 'list' | 'calendar';
export type BookingListLayout = 'items' | 'orders';

interface SheetState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  booking?: Booking | null;
}

interface PendingStatusConfirm {
  booking: Booking;
  itemId: string;
  currentStatus: BookingItemStatus;
  nextStatus: BookingItemStatus;
  targetDate: string;
}

function findItemBooking(
  item: InventoryItem,
  bookings: Booking[],
  selectedDate: string,
  isAllDates: boolean,
  statusFilter?: BookingFilterTab
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

  // If user is specifically viewing the 'returned' tab, check if any booking has returned status
  if (statusFilter === 'returned') {
    for (const b of itemBookings) {
      const match = b.items.find(
        (li) =>
          li.itemId === item.id ||
          li.itemCode.toLowerCase() === item.code.toLowerCase()
      );
      const computed = isAllDates
        ? getLatestBookingStatus(b)
        : selectedDate >= b.startDate && selectedDate <= b.cleaningEndDate
        ? getBookingStatusOnDate(b, selectedDate)
        : getLatestBookingStatus(b);
      if (match && computed === 'returned') {
        return { booking: b, lineItem: match, status: 'returned' };
      }
    }
  }

  if (!isAllDates) {
    const matching = itemBookings.find(
      (b) => selectedDate >= b.startDate && selectedDate <= b.cleaningEndDate
    );
    if (matching) {
      const lineItem = matching.items.find(
        (li) =>
          li.itemId === item.id ||
          li.itemCode.toLowerCase() === item.code.toLowerCase()
      );
      if (lineItem) {
        const status = getBookingStatusOnDate(matching, selectedDate);
        return { booking: matching, lineItem, status };
      }
    }
    return { booking: null, lineItem: null, status: 'available' };
  } else {
    // isAllDates: check for active booking
    const active = itemBookings.find((b) => !isBookingFullyReturned(b));
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

function matchesBookingSearch(booking: Booking, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const qDigits = q.replace(/[\s-]/g, '');
  const phoneDigits = booking.customerPhone.replace(/[\s-]/g, '').toLowerCase();

  if (booking.customerName.toLowerCase().includes(q)) return true;
  if (booking.customerPhone.toLowerCase().includes(q)) return true;
  if (qDigits.length > 0 && phoneDigits.includes(qDigits)) return true;
  if (booking.customerLineId?.toLowerCase().includes(q)) return true;

  return booking.items.some(
    (li) =>
      li.itemCode.toLowerCase().includes(q) ||
      li.itemName.toLowerCase().includes(q)
  );
}

export const BookingsPage: React.FC = () => {
  const {
    bookings,
    loading,
    error,
    addBooking,
    updateBooking,
    updateItemStatus,
    deleteBooking,
  } = useBookings();
  const { customers, addCustomer } = useCustomers();
  const { items: inventoryItems } = useInventory();

  const today = useMemo(() => getTodayISO(), []);
  const [selectedDate, setSelectedDate] = useState<string>(() => today);
  const [isAllDates, setIsAllDates] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [statusFilter, setStatusFilter] = useState<BookingFilterTab>('active');
  const [viewMode, setViewMode] = useState<BookingViewMode>('list');
  const [listLayout, setListLayout] = useState<BookingListLayout>('items');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<BookingSortKey>('startDate_asc');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [pendingStatusConfirm, setPendingStatusConfirm] =
    useState<PendingStatusConfirm | null>(null);

  const [sheetState, setSheetState] = useState<SheetState>({
    isOpen: false,
    mode: 'add',
    booking: null,
  });

  const currentFilterTab = useMemo(
    () => FILTER_TABS.find((t) => t.id === statusFilter),
    [statusFilter]
  );
  const currentFilterLabel = useMemo(() => {
    if (statusFilter === 'active') return 'ตัวกรอง';
    if (statusFilter === 'available') return 'ว่าง';
    return BOOKING_STATUS_META[statusFilter]?.label ?? 'ตัวกรอง';
  }, [statusFilter]);

  const dateButtonLabel = useMemo(() => {
    if (isAllDates) return 'แสดงทุกวัน (คลิกเพื่อเลือกวัน)';
    if (selectedDate === today) return `${formatDateThaiShort(selectedDate)} (วันนี้)`;
    return formatDateThaiShortWithYear(selectedDate);
  }, [isAllDates, selectedDate, today]);

  // Inventory-centric items list with booking status on selected date
  const itemBookingEntries = useMemo(() => {
    return inventoryItems.map((item) => {
      const result = findItemBooking(
        item,
        bookings,
        selectedDate,
        isAllDates,
        statusFilter
      );
      return { item, ...result };
    });
  }, [inventoryItems, bookings, selectedDate, isAllDates, statusFilter]);

  const filteredItemEntries = useMemo(() => {
    const list = itemBookingEntries.filter((entry) => {
      if (statusFilter === 'active') {
        // Active shows all items (both available and active bookings)
      } else if (statusFilter === 'available') {
        if (entry.status !== 'available') return false;
      } else {
        if (entry.status !== statusFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const qDigits = q.replace(/[\s-]/g, '');
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

        if (!matchItem && !matchBooking) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortKey === 'code_asc') {
        return a.item.code.localeCompare(b.item.code, undefined, { numeric: true });
      }
      if (sortKey === 'code_desc') {
        return b.item.code.localeCompare(a.item.code, undefined, { numeric: true });
      }
      if (sortKey === 'startDate_asc') {
        if (a.booking && !b.booking) return -1;
        if (!a.booking && b.booking) return 1;
        if (a.booking && b.booking) {
          return a.booking.startDate.localeCompare(b.booking.startDate);
        }
        return a.item.code.localeCompare(b.item.code, undefined, { numeric: true });
      }
      if (sortKey === 'startDate_desc') {
        if (a.booking && !b.booking) return -1;
        if (!a.booking && b.booking) return 1;
        if (a.booking && b.booking) {
          return b.booking.startDate.localeCompare(a.booking.startDate);
        }
        return b.item.code.localeCompare(a.item.code, undefined, { numeric: true });
      }
      if (sortKey === 'createdAt_desc') {
        if (a.booking && !b.booking) return -1;
        if (!a.booking && b.booking) return 1;
        if (a.booking && b.booking) {
          return b.booking.createdAt.localeCompare(a.booking.createdAt);
        }
        return a.item.code.localeCompare(b.item.code, undefined, { numeric: true });
      }
      return 0;
    });
  }, [itemBookingEntries, statusFilter, searchQuery, sortKey]);

  // Order-centric bookings list
  const filteredBookings = useMemo(() => {
    const byDate = isAllDates
      ? bookings
      : bookings.filter((b) => {
          if (statusFilter === 'returned') {
            return (
              (selectedDate >= b.startDate &&
                selectedDate <= b.cleaningEndDate &&
                getBookingStatusOnDate(b, selectedDate) === 'returned') ||
              getLatestBookingStatus(b) === 'returned'
            );
          }
          return selectedDate >= b.startDate && selectedDate <= b.cleaningEndDate;
        });

    const byStatus = byDate.filter((b) => {
      const computed = getEffectiveBookingStatus(b, selectedDate, isAllDates);
      if (statusFilter === 'active') {
        return isAllDates ? !isBookingFullyReturned(b) : computed !== 'returned';
      }
      if (statusFilter === 'available') {
        return false;
      }
      if (statusFilter === 'returned') {
        return computed === 'returned' || getLatestBookingStatus(b) === 'returned';
      }
      return computed === statusFilter;
    });

    const bySearch = byStatus.filter((b) =>
      matchesBookingSearch(b, searchQuery)
    );

    return [...bySearch].sort((a, b) => {
      if (sortKey === 'startDate_asc') {
        return a.startDate.localeCompare(b.startDate);
      }
      if (sortKey === 'startDate_desc') {
        return b.startDate.localeCompare(a.startDate);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [bookings, statusFilter, isAllDates, selectedDate, searchQuery, sortKey]);

  const tabCounts = useMemo(() => {
    const counts: Record<BookingFilterTab, number> = {
      active: itemBookingEntries.length,
      available: 0,
      reserved: 0,
      pending_delivery: 0,
      delivered: 0,
      pending_return: 0,
      in_laundry: 0,
      returned: 0,
    };

    for (const entry of itemBookingEntries) {
      if (entry.status === 'available') {
        counts.available += 1;
      } else if (entry.status in counts) {
        counts[entry.status as BookingFilterTab] += 1;
      }
    }

    counts.returned = inventoryItems.filter((item) =>
      bookings.some(
        (b) =>
          b.items.some(
            (li) =>
              li.itemId === item.id ||
              li.itemCode.toLowerCase() === item.code.toLowerCase()
          ) && getLatestBookingStatus(b) === 'returned'
      )
    ).length;

    return counts;
  }, [itemBookingEntries, inventoryItems, bookings]);

  const handleOpenAdd = () => {
    const start = isAllDates ? today : selectedDate;
    const end = addDaysISO(start, 2);
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
        durationDays: 3,
        rentalPrice: 0,
        deposit: 1000,
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
    const end = addDaysISO(start, 2);
    const cleaning = addDaysISO(end, 2);
    const defaultPrice = item.rentalPrices?.[0]?.price ?? 0;

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
        durationDays: 3,
        rentalPrice: defaultPrice,
        deposit: 1000,
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

  const handleCloseSheet = () => {
    setSheetState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSubmitSheet = async (data: NewBookingInput) => {
    if (sheetState.mode === 'edit' && sheetState.booking) {
      await updateBooking(sheetState.booking.id, data);
    } else {
      await addBooking(data);
    }
  };

  const handleDeleteSheet = async (id: string) => {
    await deleteBooking(id);
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
    await updateItemStatus(booking.id, itemId, nextStatus, undefined, targetDate);
  };

  const handleToggleDepositRefunded = async (booking: Booking) => {
    await updateBooking(booking.id, {
      depositRefunded: !booking.depositRefunded,
    });
  };

  const renderFloatingToolbar = () => (
    <nav className="center-align tiny-space">
      <nav className="toolbar secondary-container medium-elevate">
        <span className="bold" style={{ whiteSpace: 'nowrap' }}>
          {listLayout === 'items' && viewMode === 'list'
            ? `${filteredItemEntries.length} ชุด`
            : `${filteredBookings.length} การจอง`}
        </span>

        {searchOpen ? (
          <div
            className="field small round border surface no-margin"
            style={{ width: '180px' }}
          >
            <input
              type="search"
              aria-label="ค้นหาการจอง"
              placeholder="ค้นหาชื่อ, เบอร์, รหัสชุด..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        ) : null}

        <button
          className="circle transparent no-margin"
          type="button"
          onClick={() => {
            if (searchOpen && searchQuery) {
              setSearchQuery('');
            } else {
              setSearchOpen((prev) => !prev);
            }
          }}
          aria-label="ค้นหา"
          title="ค้นหา"
        >
          <i>{searchOpen ? 'close' : 'search'}</i>
        </button>

        {viewMode === 'list' && (
          <button
            className={`circle no-margin ${listLayout === 'items' ? 'fill primary' : 'transparent'}`}
            type="button"
            onClick={() =>
              setListLayout((prev) => (prev === 'items' ? 'orders' : 'items'))
            }
            aria-label={
              listLayout === 'items'
                ? 'สลับเป็นมุมมองใบจอง'
                : 'สลับเป็นมุมมองรายชุด'
            }
            title={
              listLayout === 'items'
                ? 'สลับเป็นมุมมองใบจอง'
                : 'สลับเป็นมุมมองรายชุด'
            }
          >
            <i>{listLayout === 'items' ? 'checkroom' : 'receipt_long'}</i>
          </button>
        )}

        <button
          className="circle transparent no-margin"
          type="button"
          onClick={() =>
            setViewMode((prev) => (prev === 'list' ? 'calendar' : 'list'))
          }
          aria-label={
            viewMode === 'list' ? 'สลับเป็นมุมมองปฏิทิน' : 'สลับเป็นมุมมองรายการ'
          }
          title={
            viewMode === 'list' ? 'สลับเป็นมุมมองปฏิทิน' : 'สลับเป็นมุมมองรายการ'
          }
        >
          <i>{viewMode === 'list' ? 'calendar_month' : 'view_agenda'}</i>
        </button>
      </nav>

      <button
        className="circle primary medium-elevate extra no-margin"
        type="button"
        onClick={handleOpenAdd}
        aria-label="สร้างการจองใหม่"
        title="สร้างการจองใหม่"
      >
        <i>add</i>
      </button>
    </nav>
  );

  return (
    <div className="bookings-page">
      {/* Date Navigation & Filter Bar */}
      <div
        data-testid="bookings-date-bar"
        className="surface-container-low bottom-margin"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '6px 8px',
          borderRadius: '16px',
          border: '1px solid var(--outline-variant)',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Date Navigation Group */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            minWidth: 0,
            flexShrink: 1,
          }}
        >
          <button
            type="button"
            className="circle transparent no-margin"
            onClick={() => {
              setSelectedDate((prev) => addDaysISO(prev, -1));
              setIsAllDates(false);
            }}
            aria-label="วันก่อนหน้า"
            title="วันก่อนหน้า"
            style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              minHeight: '32px',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i style={{ fontSize: '18px' }}>chevron_left</i>
          </button>

          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', minWidth: 0 }}>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  setIsAllDates(false);
                }
              }}
              style={{
                position: 'absolute',
                opacity: 0,
                pointerEvents: 'none',
                width: 0,
                height: 0,
              }}
              tabIndex={-1}
              aria-hidden="true"
            />
            <button
              type="button"
              className="chip surface-container-high border bold no-margin"
              onClick={() => {
                if (dateInputRef.current) {
                  if ('showPicker' in HTMLInputElement.prototype) {
                    try {
                      dateInputRef.current.showPicker();
                    } catch {
                      dateInputRef.current.focus();
                    }
                  } else {
                    dateInputRef.current.focus();
                  }
                }
              }}
              aria-label="เลือกวันที่"
              title="คลิกเพื่อเลือกวันที่"
              style={{
                minHeight: '32px',
                height: '32px',
                padding: '0 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                borderRadius: '8px',
                minWidth: 0,
                cursor: 'pointer',
              }}
            >
              <i className="small" style={{ fontSize: '16px', flexShrink: 0 }}>
                calendar_month
              </i>
              <span
                style={{
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                }}
              >
                {dateButtonLabel}
              </span>
              <i className="tiny" style={{ fontSize: '14px', flexShrink: 0 }}>
                arrow_drop_down
              </i>
            </button>
          </div>

          <button
            type="button"
            className="circle transparent no-margin"
            onClick={() => {
              setSelectedDate((prev) => addDaysISO(prev, 1));
              setIsAllDates(false);
            }}
            aria-label="วันถัดไป"
            title="วันถัดไป"
            style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              minHeight: '32px',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i style={{ fontSize: '18px' }}>chevron_right</i>
          </button>

          {selectedDate !== today && !isAllDates && (
            <button
              type="button"
              className="chip surface-container-high border primary-text bold no-margin"
              onClick={() => {
                setSelectedDate(today);
                setIsAllDates(false);
              }}
              title="กลับไปวันนี้"
              aria-label="กลับไปวันนี้"
              style={{
                height: '32px',
                minHeight: '32px',
                padding: '0 8px',
                borderRadius: '8px',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <span style={{ fontSize: '11.5px' }}>วันนี้</span>
            </button>
          )}
        </div>

        {/* Filter Dropdown Button */}
        <button
          type="button"
          className={`chip surface-container-high ${
            statusFilter !== 'active' ? 'primary' : 'border'
          } bold no-margin`}
          data-testid="booking-filter-dropdown"
          aria-label={`ตัวกรองสถานะ: ${currentFilterTab?.label ?? currentFilterLabel}`}
          title={`ตัวกรองสถานะ: ${currentFilterTab?.label ?? currentFilterLabel}`}
          aria-haspopup="dialog"
          aria-expanded={filterSheetOpen}
          onClick={() => setFilterSheetOpen(true)}
          style={{
            minHeight: '32px',
            height: '32px',
            padding: '0 8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            borderRadius: '8px',
            cursor: 'pointer',
            flexShrink: 0,
            maxWidth: '145px',
          }}
        >
          <i className="small" style={{ fontSize: '16px', flexShrink: 0 }}>
            tune
          </i>
          <span
            style={{
              fontSize: '12px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {currentFilterLabel}
          </span>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '6px',
              backgroundColor:
                statusFilter !== 'active'
                  ? 'var(--on-primary)'
                  : 'var(--primary)',
              color:
                statusFilter !== 'active'
                  ? 'var(--primary)'
                  : 'var(--on-primary)',
              lineHeight: '14px',
              flexShrink: 0,
            }}
          >
            {tabCounts[statusFilter]}
          </span>
          <i className="tiny" style={{ fontSize: '14px', flexShrink: 0 }}>
            arrow_drop_down
          </i>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div
          className="grid"
          aria-busy="true"
          aria-label="กำลังโหลดรายการจอง"
        >
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="s12 m6">
              <article className="border round surface medium-padding no-margin">
                <Stack orientation="column" gap="small">
                  <div
                    className="skeleton round"
                    style={{ width: '60%', height: '24px' }}
                  />
                  <div
                    className="skeleton round"
                    style={{ width: '100%', height: '64px' }}
                  />
                  <div
                    className="skeleton round"
                    style={{ width: '45%', height: '20px' }}
                  />
                </Stack>
              </article>
            </div>
          ))}
        </div>
      ) : error ? (
        <article className="border error-container round margin">
          <div className="row items-center">
            <i className="error-text">error</i>
            <div className="max">
              <h6 className="bold no-margin error-text">
                เกิดข้อผิดพลาดในการโหลดข้อมูลการจอง
              </h6>
              <p className="no-margin secondary-text">{error.message}</p>
            </div>
          </div>
        </article>
      ) : viewMode === 'calendar' ? (
        <BookingCalendar
          bookings={filteredBookings}
          onEditBooking={handleOpenEdit}
          onAdvanceItemStatus={handleAdvanceItemStatus}
          onToggleDepositRefunded={handleToggleDepositRefunded}
        />
      ) : listLayout === 'items' ? (
        filteredItemEntries.length === 0 ? (
          <EmptyState
            icon={searchQuery ? 'search_off' : 'event_note'}
            title={
              searchQuery
                ? 'ไม่พบชุดที่ตรงกับเงื่อนไขการค้นหา'
                : statusFilter === 'available'
                ? 'ไม่มีชุดว่างในหมวดหมู่นี้'
                : !isAllDates
                ? 'ไม่มีคิวจองในวันที่เลือก'
                : statusFilter === 'active'
                ? 'ไม่มีรายการชุดที่กำลังดำเนินการ'
                : 'ไม่พบรายการชุดในหมวดหมู่นี้'
            }
            description={
              searchQuery
                ? 'ลองค้นหาด้วยชื่อลูกค้า เบอร์โทรศัพท์ หรือรหัสชุดอื่น'
                : !isAllDates
                ? `ไม่มีชุดในสถานะนี้ในวันที่ ${formatDateThaiFull(selectedDate)}`
                : 'ลองเลือกดูหมวดหมู่อื่น หรือกดปุ่มด้านล่างเพื่อสร้างการจองใหม่'
            }
            actionIcon="add"
            actionText="สร้างการจองใหม่"
            onAction={handleOpenAdd}
            secondaryActionIcon={
              searchQuery
                ? 'close'
                : !isAllDates
                ? 'calendar_month'
                : statusFilter !== 'active'
                ? 'restart_alt'
                : undefined
            }
            secondaryActionText={
              searchQuery
                ? 'ล้างการค้นหา'
                : !isAllDates
                ? 'ดูการจองทุกวัน'
                : statusFilter !== 'active'
                ? 'ดูชุดทั้งหมด'
                : undefined
            }
            onSecondaryAction={
              searchQuery
                ? () => setSearchQuery('')
                : !isAllDates
                ? () => setIsAllDates(true)
                : statusFilter !== 'active'
                ? () => setStatusFilter('active')
                : undefined
            }
          />
        ) : (
          <div className="grid">
            {filteredItemEntries.map((entry) => (
              <div key={entry.item.id} className="s12 m12 l6">
                <BookingInventoryCard
                  item={entry.item}
                  booking={entry.booking}
                  lineItem={entry.lineItem}
                  selectedDate={selectedDate}
                  isAllDates={isAllDates}
                  onReserve={handleReserveItem}
                  onEditBooking={handleOpenEdit}
                  onAdvanceItemStatus={handleAdvanceItemStatus}
                />
              </div>
            ))}
          </div>
        )
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={searchQuery ? 'search_off' : 'event_note'}
          title={
            searchQuery
              ? 'ไม่พบรายการจองที่ตรงกับคำค้นหา'
              : !isAllDates
              ? 'ไม่มีคิวจองในวันที่เลือก'
              : statusFilter === 'active'
              ? 'ไม่มีรายการจองที่กำลังดำเนินการ'
              : 'ไม่พบรายการจองในหมวดหมู่นี้'
          }
          description={
            searchQuery
              ? 'ลองค้นหาด้วยชื่อลูกค้า เบอร์โทรศัพท์ หรือรหัสชุดอื่น'
              : !isAllDates
              ? `ไม่มีรายการจองหรือส่งซักชุดในวันที่ ${formatDateThaiFull(selectedDate)}`
              : 'กดปุ่มด้านล่างเพื่อสร้างรายการจองชุดใหม่'
          }
          actionIcon="add"
          actionText="สร้างการจองใหม่"
          onAction={handleOpenAdd}
          secondaryActionIcon={
            searchQuery
              ? 'close'
              : !isAllDates
              ? 'calendar_month'
              : statusFilter !== 'active'
              ? 'restart_alt'
              : undefined
          }
          secondaryActionText={
            searchQuery
              ? 'ล้างการค้นหา'
              : !isAllDates
              ? 'ดูการจองทุกวัน'
              : statusFilter !== 'active'
              ? 'ดูการจองที่กำลังดำเนินการ'
              : undefined
          }
          onSecondaryAction={
            searchQuery
              ? () => setSearchQuery('')
              : !isAllDates
              ? () => setIsAllDates(true)
              : statusFilter !== 'active'
              ? () => setStatusFilter('active')
              : undefined
          }
        />
      ) : (
        <div className="grid">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="s12 m6">
              <BookingCard
                booking={booking}
                selectedDate={selectedDate}
                isAllDates={isAllDates}
                onEdit={handleOpenEdit}
                onAdvanceItemStatus={handleAdvanceItemStatus}
                onToggleDepositRefunded={handleToggleDepositRefunded}
              />
            </div>
          ))}
        </div>
      )}

      {/* Bottom Spacing for Floating Bar */}
      <div className="extra-space"></div>
      <div className="large-space"></div>

      {/* Small screens: centered floating bottom toolbar */}
      <div className="fixed bottom center margin front s">
        {renderFloatingToolbar()}
      </div>

      {/* Medium & Large screens: right-aligned floating bottom toolbar */}
      <div className="fixed bottom right margin front m l">
        {renderFloatingToolbar()}
      </div>

      {/* Past / Future Status Change Confirmation Dialog */}
      {pendingStatusConfirm && (
        <>
          <div
            className="overlay active"
            onClick={() => setPendingStatusConfirm(null)}
            style={{ zIndex: 1002 }}
          />
          <dialog
            open
            className="active round medium-padding"
            aria-label="ยืนยันการเปลี่ยนสถานะต่างวัน"
            data-testid="confirm-status-date-dialog"
            style={{ zIndex: 1003, maxWidth: '380px', width: '92vw' }}
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
          </dialog>
        </>
      )}

      {/* Booking Filter & Sort Bottom Sheet */}
      <BookingFilterSheet
        isOpen={filterSheetOpen}
        selectedFilter={statusFilter}
        tabCounts={tabCounts}
        selectedSort={sortKey}
        onSelectFilter={setStatusFilter}
        onSelectSort={setSortKey}
        onClose={() => setFilterSheetOpen(false)}
      />

      {/* Booking Add / Edit Sheet */}
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
      />
    </div>
  );
};
