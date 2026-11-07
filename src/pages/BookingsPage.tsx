import React, { useState, useMemo } from 'react';
import {
  BOOKING_STATUS_META,
  BOOKING_STATUS_ORDER,
  isBookingFullyReturned,
  getBookingStatusOnDate,
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
import { BookingSortDialog } from '../components/BookingSortDialog';
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
import { Skeleton } from '../components/Skeleton';
import { FloatingBottomToolbar } from '../components/FloatingBottomToolbar';
import { Modal, Collapsible } from '../common/components';
import './BookingsPage.css';

export type { BookingFilterTab, BookingSortKey };
export { FILTER_TABS, SORT_OPTIONS };
export type BookingListLayout = 'items' | 'orders';

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
  initialStep?: number;
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
  statusFilters?: BookingFilterTab[]
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
  if (statusFilters?.includes('returned')) {
    for (const b of itemBookings) {
      const match = b.items.find(
        (li) =>
          li.itemId === item.id ||
          li.itemCode.toLowerCase() === item.code.toLowerCase()
      );
      let computed: BookingItemStatus;
      if (isAllDates) {
        computed = getLatestBookingStatus(b);
      } else if (selectedDate >= b.startDate && selectedDate <= b.cleaningEndDate) {
        computed = getBookingStatusOnDate(b, selectedDate);
      } else {
        computed = getLatestBookingStatus(b);
      }
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

interface BookingsEmptyStateParams {
  layout: 'items' | 'bookings';
  searchQuery: string;
  statusFilters?: BookingFilterTab[];
  statusFilter?: BookingFilterTab;
  isAllDates: boolean;
  selectedDate: string;
  onOpenAdd: () => void;
  onClearSearch: () => void;
  onViewAllDates: () => void;
  onResetFilter: () => void;
}

function getBookingsEmptyStateProps(params: BookingsEmptyStateParams) {
  const {
    layout,
    searchQuery,
    statusFilters,
    statusFilter,
    isAllDates,
    selectedDate,
    onOpenAdd,
    onClearSearch,
    onViewAllDates,
    onResetFilter,
  } = params;

  const currentFilters = statusFilters ?? (statusFilter ? [statusFilter] : ['all']);
  const isDefaultAll =
    currentFilters.includes('all') ||
    currentFilters.includes('active') ||
    currentFilters.length === 0;

  if (searchQuery) {
    return {
      icon: 'search_off',
      title:
        layout === 'items'
          ? 'ไม่พบชุดที่ตรงกับเงื่อนไขการค้นหา'
          : 'ไม่พบรายการจองที่ตรงกับคำค้นหา',
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
      description:
        layout === 'items'
          ? `ไม่มีชุดในสถานะนี้ในวันที่ ${formatDateThaiFull(selectedDate)}`
          : `ไม่มีรายการจองหรือส่งซักชุดในวันที่ ${formatDateThaiFull(selectedDate)}`,
      actionIcon: 'add',
      actionText: 'สร้างการจองใหม่',
      onAction: onOpenAdd,
      secondaryActionIcon: 'calendar_month',
      secondaryActionText: 'ดูการจองทุกวัน',
      onSecondaryAction: onViewAllDates,
    };
  }

  const secondaryAction = !isDefaultAll
    ? {
        secondaryActionIcon: 'restart_alt',
        secondaryActionText:
          layout === 'items' ? 'ดูชุดทั้งหมด' : 'ดูการจองทั้งหมด',
        onSecondaryAction: onResetFilter,
      }
    : {};

  if (layout === 'items') {
    if (currentFilters.length === 1 && currentFilters[0] === 'available') {
      return {
        icon: 'event_note',
        title: 'ไม่มีชุดว่างในหมวดหมู่นี้',
        description:
          'ลองเลือกดูหมวดหมู่อื่น หรือกดปุ่มด้านล่างเพื่อสร้างการจองใหม่',
        actionIcon: 'add',
        actionText: 'สร้างการจองใหม่',
        onAction: onOpenAdd,
        ...secondaryAction,
      };
    }
    return {
      icon: 'event_note',
      title: 'ไม่พบชุดในสถานะที่เลือก',
      description:
        'ลองเปลี่ยนตัวกรอง หรือกดปุ่มด้านล่างเพื่อสร้างการจองใหม่',
      actionIcon: 'add',
      actionText: 'สร้างการจองใหม่',
      onAction: onOpenAdd,
      ...secondaryAction,
    };
  }

  // layout === 'bookings'
  return {
    icon: 'event_note',
    title: isDefaultAll
      ? 'ไม่มีรายการจองที่กำลังดำเนินการ'
      : 'ไม่พบรายการจองในหมวดหมู่นี้',
    description: 'กดปุ่มด้านล่างเพื่อสร้างรายการจองชุดใหม่',
    actionIcon: 'add',
    actionText: 'สร้างการจองใหม่',
    onAction: onOpenAdd,
    ...secondaryAction,
  };
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

  const [statusFilters, setStatusFilters] = useState<BookingFilterTab[]>(['all']);
  const [listLayout, setListLayout] = useState<BookingListLayout>('items');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<BookingSortKey>('startDate_asc');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [calendarSheetOpen, setCalendarSheetOpen] = useState(false);
  const [pendingStatusConfirm, setPendingStatusConfirm] =
    useState<PendingStatusConfirm | null>(null);

  const [sheetState, setSheetState] = useState<SheetState>({
    isOpen: false,
    mode: 'add',
    booking: null,
  });

  // Inventory-centric items list with booking status on selected date
  const itemBookingEntries = useMemo(() => {
    return inventoryItems.map((item) => {
      const result = findItemBooking(
        item,
        bookings,
        selectedDate,
        isAllDates,
        statusFilters
      );
      return { item, ...result };
    });
  }, [inventoryItems, bookings, selectedDate, isAllDates, statusFilters]);

  const filteredItemEntries = useMemo(() => {
    const isAll =
      statusFilters.includes('all') ||
      statusFilters.includes('active') ||
      statusFilters.length === 0;

    const list = itemBookingEntries.filter((entry) => {
      if (!isAll) {
        if (!statusFilters.includes(entry.status as BookingFilterTab)) {
          return false;
        }
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
  }, [itemBookingEntries, statusFilters, searchQuery, sortKey]);

  // Order-centric bookings list
  const filteredBookings = useMemo(() => {
    const isAll =
      statusFilters.includes('all') ||
      statusFilters.includes('active') ||
      statusFilters.length === 0;

    const byDate = isAllDates
      ? bookings
      : bookings.filter((b) => {
          if (!isAll && statusFilters.includes('returned') && !statusFilters.some(s => s !== 'returned')) {
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
      if (isAll) {
        return isAllDates ? !isBookingFullyReturned(b) : computed !== 'returned';
      }
      if (statusFilters.includes('available') && statusFilters.length === 1) {
        return false;
      }
      return (
        statusFilters.includes(computed as BookingFilterTab) ||
        (statusFilters.includes('returned') && getLatestBookingStatus(b) === 'returned')
      );
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
  }, [bookings, statusFilters, isAllDates, selectedDate, searchQuery, sortKey]);

  // Group item entries by status for collapsible sections
  const groupedItemEntries = useMemo(() => {
    const statusOrder: (BookingItemStatus | 'available')[] = [
      ...BOOKING_STATUS_ORDER,
      'available',
    ];

    const groups: {
      status: BookingItemStatus | 'available';
      label: string;
      chipClass: string;
      filledBadgeClass: string;
      entries: typeof filteredItemEntries;
    }[] = [];

    for (const st of statusOrder) {
      const entries = filteredItemEntries.filter((entry) => entry.status === st);
      if (entries.length > 0) {
        if (st === 'available') {
          groups.push({
            status: st,
            label: 'ว่าง (พร้อมเช่า)',
            chipClass: 'hc-status-badge-available',
            filledBadgeClass: 'hc-status-badge-filled-available',
            entries,
          });
        } else {
          const meta = BOOKING_STATUS_META[st];
          groups.push({
            status: st,
            label: meta.label,
            chipClass: meta.chipClass,
            filledBadgeClass: STATUS_FILLED_CLASS_MAP[st],
            entries,
          });
        }
      }
    }

    return groups;
  }, [filteredItemEntries]);

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

  const tabCounts = useMemo(() => {
    const counts: Record<BookingFilterTab, number> = {
      all: itemBookingEntries.length,
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
      initialStep: 1,
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
      initialStep: 2,
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
    <FloatingBottomToolbar
      status={
        <span className="bold hc-bookings-toolbar-count">
          {listLayout === 'items'
            ? `${filteredItemEntries.length} ชุด`
            : `${filteredBookings.length} การจอง`}
        </span>
      }
      actions={
        <>
          {searchOpen && (
            <div className="field small round border surface no-margin hc-bookings-search-field">
              <input
                type="search"
                aria-label="ค้นหาการจอง"
                placeholder="ค้นหาชื่อ, เบอร์, รหัสชุด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          )}

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

          <button
            className={`circle no-margin ${listLayout === 'items' ? 'fill tertiary' : 'transparent'}`}
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
        </>
      }
      onFabClick={handleOpenAdd}
      fabAriaLabel="สร้างการจองใหม่"
    />
  );

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

    if (listLayout === 'items') {
      if (filteredItemEntries.length === 0) {
        return (
          <EmptyState
            {...getBookingsEmptyStateProps({
              layout: 'items',
              searchQuery,
              statusFilters,
              isAllDates,
              selectedDate,
              onOpenAdd: handleOpenAdd,
              onClearSearch: () => setSearchQuery(''),
              onViewAllDates: () => setIsAllDates(true),
              onResetFilter: () => setStatusFilters(['all']),
            })}
          />
        );
      }

      return (
        <div className="hc-bookings-status-sections">
          {groupedItemEntries.map((group) => {
            const isSingleStatusFilter =
              statusFilters.length === 1 &&
              !statusFilters.includes('all') &&
              statusFilters.includes(group.status);
            // Collapse all sections except 'ready' (available / พร้อมเช่า) by default
            const defaultOpen = group.status === 'available' || isSingleStatusFilter;

            return (
              <Collapsible
                key={group.status}
                testId={`collapsible-status-${group.status}`}
                className="hc-bookings-status-collapsible"
                variant="plain"
                title={group.label}
                defaultOpen={defaultOpen}
                badgeSlot={
                  <span
                    className={`badge none circle bold ${group.filledBadgeClass}`}
                    data-testid={`badge-count-${group.status}`}
                  >
                    {group.entries.length}
                  </span>
                }
              >
                <div className="grid">
                  {group.entries.map((entry) => (
                    <div key={entry.item.id} className="s12 m12 l6">
                      <BookingInventoryCard
                        item={entry.item}
                        booking={entry.booking}
                        lineItem={entry.lineItem}
                        selectedDate={selectedDate}
                        isAllDates={isAllDates}
                        onReserve={handleReserveItem}
                        onEditBooking={handleOpenEdit}
                        onViewBooking={handleOpenView}
                        onAdvanceItemStatus={handleAdvanceItemStatus}
                      />
                    </div>
                  ))}
                </div>
              </Collapsible>
            );
          })}
        </div>
      );
    }

    if (filteredBookings.length === 0) {
      return (
        <EmptyState
          {...getBookingsEmptyStateProps({
            layout: 'bookings',
            searchQuery,
            statusFilters,
            isAllDates,
            selectedDate,
            onOpenAdd: handleOpenAdd,
            onClearSearch: () => setSearchQuery(''),
            onViewAllDates: () => setIsAllDates(true),
            onResetFilter: () => setStatusFilters(['all']),
          })}
        />
      );
    }

    return (
      <div className="hc-bookings-status-sections">
        {groupedBookings.map((group) => {
          const isSingleStatusFilter =
            statusFilters.length === 1 &&
            !statusFilters.includes('all') &&
            statusFilters.includes(group.status);
          const defaultOpen = isSingleStatusFilter;

          return (
            <Collapsible
              key={group.status}
              testId={`collapsible-status-${group.status}`}
              className="hc-bookings-status-collapsible"
              variant="plain"
              title={group.label}
              defaultOpen={defaultOpen}
              badgeSlot={
                <span
                  className={`badge none circle bold ${group.filledBadgeClass}`}
                  data-testid={`badge-count-${group.status}`}
                >
                  {group.bookings.length}
                </span>
              }
            >
              <div className="grid">
                {group.bookings.map((booking) => (
                  <div key={booking.id} className="s12 m6">
                    <BookingCard
                      booking={booking}
                      selectedDate={selectedDate}
                      isAllDates={isAllDates}
                      onEdit={handleOpenEdit}
                      onView={handleOpenView}
                      onAdvanceItemStatus={handleAdvanceItemStatus}
                      onToggleDepositRefunded={handleToggleDepositRefunded}
                    />
                  </div>
                ))}
              </div>
            </Collapsible>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bookings-page">
      {/* Date Navigation & Filter Bar (BeerCSS Toolbar) */}
      <BookingDateBar
        selectedDate={selectedDate}
        today={today}
        isAllDates={isAllDates}
        statusFilter={statusFilters[0] ?? 'all'}
        statusFilters={statusFilters}
        tabCounts={tabCounts}
        selectedSort={sortKey}
        filterSheetOpen={filterSheetOpen}
        sortDialogOpen={sortDialogOpen}
        calendarSheetOpen={calendarSheetOpen}
        onDateChange={(newDate) => {
          setSelectedDate(newDate);
          setIsAllDates(false);
        }}
        onFilterClick={() => setFilterSheetOpen(true)}
        onSortClick={() => setSortDialogOpen(true)}
        onCalendarClick={() => setCalendarSheetOpen(true)}
        onSelectSort={setSortKey}
      />

      {/* Main Content Area */}
      {renderContent()}

      {/* Bottom Spacing for Floating Bar */}
      <div className="extra-space"></div>
      <div className="large-space"></div>

      {/* M3 Expressive Floating Bottom Action Toolbar + FAB */}
      {renderFloatingToolbar()}

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
        onSelectDate={(newDate) => {
          setSelectedDate(newDate);
          setIsAllDates(false);
        }}
        onClose={() => setCalendarSheetOpen(false)}
      />

      {/* Booking Filter Dialog */}
      <BookingFilterSheet
        isOpen={filterSheetOpen}
        selectedFilters={statusFilters}
        tabCounts={tabCounts}
        onSelectFilter={setStatusFilters}
        onClose={() => setFilterSheetOpen(false)}
      />

      {/* Booking Sort Dialog */}
      <BookingSortDialog
        isOpen={sortDialogOpen}
        selectedSort={sortKey}
        onSelectSort={(newSort) => {
          setSortKey(newSort);
          setSortDialogOpen(false);
        }}
        onClose={() => setSortDialogOpen(false)}
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
        initialStep={sheetState.initialStep ?? 1}
        onAddCustomer={addCustomer}
        onClose={handleCloseSheet}
        onSubmit={handleSubmitSheet}
        onDelete={sheetState.mode === 'edit' ? handleDeleteSheet : undefined}
      />
    </div>
  );
};
