import React, { useState, useMemo } from 'react';
import {
  BOOKING_STATUS_META,
  BOOKING_STATUS_ORDER,
  isBookingFullyReturned,
  type Booking,
  type BookingItemStatus,
} from '../types/booking';
import type { NewBookingInput } from '../services/bookings';
import { useBookings } from '../hooks/useBookings';
import { useCustomers } from '../hooks/useCustomers';
import { useInventory } from '../hooks/useInventory';
import { BookingCard } from '../components/BookingCard';
import { BookingCalendar } from '../components/BookingCalendar';
import { BookingSheet } from '../components/BookingSheet';
import { Stack } from '../components/Stack';

export type BookingFilterTab = 'active' | BookingItemStatus;
export type BookingViewMode = 'list' | 'calendar';
export type BookingSortKey = 'startDate_asc' | 'startDate_desc' | 'createdAt_desc';

interface SheetState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  booking?: Booking | null;
}

const FILTER_TABS: { id: BookingFilterTab; label: string }[] = [
  { id: 'active', label: 'กำลังดำเนินการ' },
  ...BOOKING_STATUS_ORDER.map((status) => ({
    id: status,
    label: BOOKING_STATUS_META[status].label,
  })),
];

const SORT_OPTIONS: { key: BookingSortKey; label: string }[] = [
  { key: 'startDate_asc', label: 'วันรับชุด (ใกล้สุดก่อน)' },
  { key: 'startDate_desc', label: 'วันรับชุด (ไกลสุดก่อน)' },
  { key: 'createdAt_desc', label: 'วันที่ทำรายการล่าสุด' },
];

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

  const [statusFilter, setStatusFilter] = useState<BookingFilterTab>('active');
  const [viewMode, setViewMode] = useState<BookingViewMode>('list');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<BookingSortKey>('startDate_asc');
  const [sortDialogOpen, setSortDialogOpen] = useState(false);

  const [sheetState, setSheetState] = useState<SheetState>({
    isOpen: false,
    mode: 'add',
    booking: null,
  });

  const filteredBookings = useMemo(() => {
    const byStatus = bookings.filter((b) => {
      if (statusFilter === 'active') {
        return !isBookingFullyReturned(b);
      }
      return b.items.some((li) => li.status === statusFilter);
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
  }, [bookings, statusFilter, searchQuery, sortKey]);

  const tabCounts = useMemo(() => {
    const counts: Record<BookingFilterTab, number> = {
      active: 0,
      reserved: 0,
      pending_delivery: 0,
      delivered: 0,
      pending_return: 0,
      in_laundry: 0,
      returned: 0,
    };

    for (const b of bookings) {
      if (!isBookingFullyReturned(b)) {
        counts.active += 1;
      }
      for (const st of BOOKING_STATUS_ORDER) {
        if (b.items.some((li) => li.status === st)) {
          counts[st] += 1;
        }
      }
    }
    return counts;
  }, [bookings]);

  const handleOpenAdd = () => {
    setSheetState({
      isOpen: true,
      mode: 'add',
      booking: null,
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
    nextStatus: BookingItemStatus
  ) => {
    await updateItemStatus(bookingId, itemId, nextStatus);
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
          {filteredBookings.length} การจอง
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

        <button
          className="circle transparent no-margin"
          type="button"
          onClick={() => setSortDialogOpen(true)}
          aria-label="จัดเรียง"
          title="จัดเรียง"
        >
          <i>sort</i>
        </button>
      </nav>

      <button
        className="extra circle primary medium-elevate no-margin"
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
    <Stack orientation="column" gap="medium">
      {/* Top Horizontal Scrollable Status Filter Chips */}
      <div
        className="row no-margin"
        role="tablist"
        aria-label="กรองสถานะการจอง"
        style={{
          overflowX: 'auto',
          gap: '8px',
          paddingBottom: '4px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {FILTER_TABS.map((tab) => {
          const isActive = statusFilter === tab.id;
          const count = tabCounts[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`chip no-margin ${
                isActive ? 'primary' : 'surface-container-high'
              }`}
              onClick={() => setStatusFilter(tab.id)}
              style={{ flexShrink: 0 }}
            >
              <span>{tab.label}</span>
              <span className="micro-text bold">({count})</span>
            </button>
          );
        })}
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
      ) : filteredBookings.length === 0 ? (
        <div
          className="center-align middle-align padding"
          style={{ minHeight: '45dvh' }}
        >
          <i className="extra secondary-text">event_note</i>
          <h5 className="secondary-text">ไม่พบรายการจองในหมวดหมู่นี้</h5>
          <p className="secondary-text">
            กดปุ่ม + ด้านล่างเพื่อสร้างรายการจองชุดใหม่
          </p>
          <div className="space" />
          <button
            type="button"
            className="primary round"
            onClick={handleOpenAdd}
          >
            <i>add</i>
            <span>สร้างการจองใหม่</span>
          </button>
        </div>
      ) : (
        <div className="grid">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="s12 m6">
              <BookingCard
                booking={booking}
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

      {/* Sort Dialog */}
      {sortDialogOpen && (
        <>
          <div
            className="overlay active"
            onClick={() => setSortDialogOpen(false)}
            style={{ zIndex: 998 }}
          />
          <dialog
            open
            className="active round medium-padding"
            aria-label="จัดเรียงรายการจอง"
            style={{ zIndex: 999, minWidth: '280px' }}
          >
            <Stack orientation="column" gap="small">
              <h6 className="bold no-margin">จัดเรียงรายการจอง</h6>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`round left-align no-margin ${
                    sortKey === opt.key ? 'primary' : 'border'
                  }`}
                  onClick={() => {
                    setSortKey(opt.key);
                    setSortDialogOpen(false);
                  }}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <i>{sortKey === opt.key ? 'radio_button_checked' : 'radio_button_unchecked'}</i>
                  <span>{opt.label}</span>
                </button>
              ))}
              <nav className="right-align">
                <button
                  type="button"
                  className="border round no-margin"
                  onClick={() => setSortDialogOpen(false)}
                >
                  ปิด
                </button>
              </nav>
            </Stack>
          </dialog>
        </>
      )}

      {/* Booking Add / Edit Sheet */}
      <BookingSheet
        isOpen={sheetState.isOpen}
        mode={sheetState.mode}
        booking={sheetState.booking}
        bookings={bookings}
        inventoryItems={inventoryItems}
        customers={customers}
        onAddCustomer={addCustomer}
        onClose={handleCloseSheet}
        onSubmit={handleSubmitSheet}
        onDelete={handleDeleteSheet}
      />
    </Stack>
  );
};
