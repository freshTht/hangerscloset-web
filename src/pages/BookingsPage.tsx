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
import { BookingSheet } from '../components/BookingSheet';
import { EmptyState } from '../components/EmptyState';
import { Stack } from '../components/Stack';
import { Skeleton } from '../components/Skeleton';
import { FloatingBottomToolbar } from '../components/FloatingBottomToolbar';
import { Modal, Collapsible } from '../common/components';
import './BookingsPage.css';

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
  layout: 'items' | 'bookings';
  searchQuery: string;
  isAllDates: boolean;
  selectedDate: string;
  onOpenAdd: () => void;
  onClearSearch: () => void;
  onViewAllDates: () => void;
}

function getBookingsEmptyStateProps(params: BookingsEmptyStateParams) {
  const {
    layout,
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
          ? `ไม่มีชุดในวันที่ ${formatDateThaiFull(selectedDate)}`
          : `ไม่มีรายการจองหรือส่งซักชุดในวันที่ ${formatDateThaiFull(selectedDate)}`,
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
    title:
      layout === 'items'
        ? 'ไม่มีชุดในระบบ'
        : 'ไม่มีรายการจองที่กำลังดำเนินการ',
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
    updateItemStatus,
    deleteBooking,
  } = useBookings();
  const { customers, addCustomer } = useCustomers();
  const { items: inventoryItems } = useInventory();

  const today = useMemo(() => getTodayISO(), []);
  const [selectedDate, setSelectedDate] = useState<string>(() => today);
  const [isAllDates, setIsAllDates] = useState(false);

  const [listLayout, setListLayout] = useState<BookingListLayout>('items');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Order-centric bookings list
  const filteredBookings = useMemo(() => {
    const byDate = isAllDates
      ? bookings.filter((b) => !isBookingFullyReturned(b))
      : bookings.filter(
          (b) =>
            selectedDate >= b.startDate && selectedDate <= b.cleaningEndDate
        );

    const bySearch = byDate.filter((b) => matchesBookingSearch(b, searchQuery));

    return [...bySearch].sort((a, b) => {
      const cmp = a.startDate.localeCompare(b.startDate);
      if (cmp !== 0) return cmp;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [bookings, isAllDates, selectedDate, searchQuery]);

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
              isAllDates,
              selectedDate,
              onOpenAdd: handleOpenAdd,
              onClearSearch: () => setSearchQuery(''),
              onViewAllDates: () => setIsAllDates(true),
            })}
          />
        );
      }

      return (
        <div className="hc-bookings-status-sections">
          {groupedItemEntries.map((group) => {
            // Collapse all sections except 'ready' (available / พร้อมเช่า) by default
            const defaultOpen = group.status === 'available';

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
            isAllDates,
            selectedDate,
            onOpenAdd: handleOpenAdd,
            onClearSearch: () => setSearchQuery(''),
            onViewAllDates: () => setIsAllDates(true),
          })}
        />
      );
    }

    return (
      <div className="hc-bookings-status-sections">
        {groupedBookings.map((group) => {
          return (
            <Collapsible
              key={group.status}
              testId={`collapsible-status-${group.status}`}
              className="hc-bookings-status-collapsible"
              variant="plain"
              title={group.label}
              defaultOpen={true}
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
      {/* Date Navigation & View Switcher Bar (BeerCSS Toolbar) */}
      <BookingDateBar
        selectedDate={selectedDate}
        today={today}
        isAllDates={isAllDates}
        calendarSheetOpen={calendarSheetOpen}
        onDateChange={(newDate) => {
          setSelectedDate(newDate);
          setIsAllDates(false);
        }}
        onCalendarClick={() => setCalendarSheetOpen(true)}
        viewMode={listLayout}
        onViewModeChange={setListLayout}
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
