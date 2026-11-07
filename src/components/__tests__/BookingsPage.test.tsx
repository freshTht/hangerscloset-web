import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BookingsPage } from '../../pages/BookingsPage';

describe('BookingsPage Component', () => {
  it('renders date selection bar and active bookings by default without filter or sort buttons', () => {
    render(<BookingsPage />);

    // Date selection bar is present
    expect(screen.getByTestId('bookings-date-bar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /วันก่อนหน้า/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /วันถัดไป/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /เลือกวันที่/i })).toBeInTheDocument();

    // The 'all day' ("ทุกวัน") button was removed from the date selector bar
    expect(screen.queryByRole('button', { name: /^ทุกวัน$/i })).not.toBeInTheDocument();

    // Filter and Sort buttons are removed
    expect(screen.queryByTestId('booking-filter-dropdown')).not.toBeInTheDocument();
    expect(screen.queryByTestId('booking-sort-button')).not.toBeInTheDocument();

    // Active booking active on today
    expect(screen.getAllByText('คุณพลอย รัตนากร').length).toBeGreaterThan(0);

    // Navigating to tomorrow (+1 day) shows tomorrow's active booking
    fireEvent.click(screen.getByRole('button', { name: /วันถัดไป/i }));
    expect(screen.getByText('คุณมายด์ พิมพ์ชนก')).toBeInTheDocument();
  });

  it('advances an item status with 1-tap button on BookingCard', async () => {
    render(<BookingsPage />);

    // Navigate to tomorrow to view booking BKN01 (book-2 starts tomorrow)
    fireEvent.click(screen.getByRole('button', { name: /วันถัดไป/i }));

    // BKN01 in book-2 starts as 'pending_delivery' (รอส่งมอบ), nextActionLabel is 'ส่งมอบแล้ว'
    const advanceBtn = screen.getByRole('button', {
      name: /ปรับสถานะ BKN01 เป็น ส่งมอบแล้ว/i,
    });
    fireEvent.click(advanceBtn);

    // Confirm status change dialog since targetDate is tomorrow
    fireEvent.click(screen.getByTestId('confirm-status-date-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('status-badge-BKN01')).toHaveTextContent(
        'ส่งมอบแล้ว'
      );
    });
  });

  it('opens calendar date picker dialog when clicking date button in BookingDateBar and auto-closes on date selection', () => {
    render(<BookingsPage />);

    // Calendar view toggle is removed from the floating bottom toolbar
    expect(
      screen.queryByRole('button', { name: /สลับเป็นมุมมองปฏิทิน/i })
    ).not.toBeInTheDocument();

    // Clicking the date picker button in BookingDateBar opens BookingCalendar sheet
    fireEvent.click(screen.getByRole('button', { name: /เลือกวันที่/i }));

    expect(
      screen.getByRole('dialog', { name: /เลือกวันที่จากปฏิทิน/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'วันนี้' })).toBeInTheDocument();
    expect(screen.getByText('อา.')).toBeInTheDocument();

    // Clicking "วันนี้" selects today and auto-closes the calendar dialog
    fireEvent.click(screen.getByRole('button', { name: 'วันนี้' }));
    expect(
      screen.queryByRole('dialog', { name: /เลือกวันที่จากปฏิทิน/i })
    ).not.toBeInTheDocument();
  });

  it('renders all inventory items with multi-select toggle and dynamic extended "จอง N ชุด" FAB', () => {
    render(<BookingsPage />);

    // In default list view, unbooked AVL01 is shown
    expect(screen.getByTestId('inventory-booking-card-AVL01')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-AVL01')).toHaveTextContent('ว่าง (พร้อมเช่า)');

    // No items selected yet -> dynamic FAB is not visible
    expect(screen.queryByTestId('bookings-action-fab')).not.toBeInTheDocument();

    // Available item has "เลือก" toggle button
    const selectBtn = screen.getByRole('button', { name: /เลือกชุด AVL01/i });
    expect(selectBtn).toBeInTheDocument();
    expect(selectBtn).toHaveTextContent('เลือก');

    // Click to select AVL01
    fireEvent.click(selectBtn);
    expect(screen.getByRole('button', { name: /เลือกแล้ว AVL01/i })).toBeInTheDocument();

    // Extended FAB appears with "จอง 1 ชุด" and shopping_bag icon
    const bookFab = screen.getByTestId('bookings-action-fab');
    expect(bookFab).toBeInTheDocument();
    expect(bookFab).toHaveTextContent('จอง 1 ชุด');
    expect(bookFab.querySelector('i')).toHaveTextContent('shopping_bag');

    // Clicking extended FAB opens BookingSheet directly at Step 2 (Customer selection)
    fireEvent.click(bookFab);
    expect(screen.getByRole('dialog', { name: /สร้างการจองใหม่/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/ค้นหาลูกค้า/i)).toBeInTheDocument();
  });

  it('toggles between Items list view and Orders list view', () => {
    render(<BookingsPage />);

    // Default is items list view
    expect(screen.getByTestId('inventory-booking-card-AVL01')).toBeInTheDocument();

    // Toggle to orders list view
    const toggleToOrdersBtns = screen.getAllByRole('button', {
      name: /สลับเป็นมุมมองใบจอง/i,
    });
    fireEvent.click(toggleToOrdersBtns[0]);

    // In orders list view, unbooked AVL01 is not rendered, but booked DIA01 order is rendered
    expect(screen.queryByTestId('inventory-booking-card-AVL01')).not.toBeInTheDocument();
    expect(screen.getAllByText('คุณพลอย รัตนากร').length).toBeGreaterThan(0);

    // Toggle back to items view
    const toggleToItemsBtns = screen.getAllByRole('button', {
      name: /สลับเป็นมุมมองรายชุด/i,
    });
    fireEvent.click(toggleToItemsBtns[0]);
    expect(screen.getByTestId('inventory-booking-card-AVL01')).toBeInTheDocument();
  });

  it('computes different booking statuses across days and blocks status change when a subsequent date progressed further', () => {
    render(<BookingsPage />);

    // Today: DIA01 (book-1) has status 'delivered' (ส่งมอบแล้ว)
    expect(screen.getByTestId('status-badge-DIA01')).toHaveTextContent('ส่งมอบแล้ว');

    // Navigate to yesterday (-1 day): DIA01 was 'pending_delivery' (รอส่งมอบ),
    // and because today already moved it to 'delivered', advancing on yesterday is blocked!
    fireEvent.click(screen.getByRole('button', { name: /วันก่อนหน้า/i }));
    expect(screen.getByTestId('status-badge-DIA01')).toHaveTextContent('รอส่งมอบ');
    expect(screen.getByTestId('subsequent-block-msg-DIA01')).toBeInTheDocument();

    const blockedBtn = screen.getByRole('button', {
      name: /ปรับสถานะ DIA01 เป็น ส่งมอบแล้ว/i,
    });
    expect(blockedBtn).toBeDisabled();
  });

  it('shows confirmation dialog when changing booking status on a future/past date', async () => {
    render(<BookingsPage />);

    // Navigate to tomorrow (+1 day): DIA01 (book-1) is 'delivered' (ส่งมอบแล้ว) and has no subsequent status
    fireEvent.click(screen.getByRole('button', { name: /วันถัดไป/i }));
    expect(screen.getByTestId('status-badge-DIA01')).toHaveTextContent('ส่งมอบแล้ว');

    const advanceBtn = screen.getByRole('button', {
      name: /ปรับสถานะ DIA01 เป็น รอรับคืน/i,
    });
    expect(advanceBtn).not.toBeDisabled();
    fireEvent.click(advanceBtn);

    // Confirmation dialog appears because selectedDate !== today
    const dialog = screen.getByTestId('confirm-status-date-dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/ยืนยันการเปลี่ยนสถานะล่วงหน้า/i);

    // Confirm the status change
    fireEvent.click(screen.getByTestId('confirm-status-date-submit'));

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-status-date-dialog')).not.toBeInTheDocument();
    });
  });

  it('collapses all sections except "ready" (available) by default and supports toggling', () => {
    render(<BookingsPage />);

    // In default items layout:
    // 'available' (ว่าง (พร้อมเช่า)) section is open by default
    const availableCollapsible = screen.getByTestId('collapsible-status-available');
    expect(availableCollapsible).toBeInTheDocument();
    expect(availableCollapsible).toHaveClass('is-open');
    const availableTrigger = availableCollapsible.querySelector('.hc-collapsible-trigger')!;
    expect(availableTrigger).toHaveAttribute('aria-expanded', 'true');

    // Other status sections like 'delivered' (ส่งมอบแล้ว) are collapsed by default
    const deliveredCollapsible = screen.getByTestId('collapsible-status-delivered');
    expect(deliveredCollapsible).toBeInTheDocument();
    expect(deliveredCollapsible).toHaveClass('is-closed');

    // Title is simple text with Beer CSS typography h6
    const heading = screen.getByRole('heading', { level: 6, name: 'ส่งมอบแล้ว' });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('small');
    expect(heading).toHaveClass('bold');

    // Count is a solid filled badge with status color in the right header section
    const badgeDelivered = screen.getByTestId('badge-count-delivered');
    expect(badgeDelivered).toBeInTheDocument();
    expect(badgeDelivered).toHaveClass('badge');
    expect(badgeDelivered).toHaveClass('none');
    expect(badgeDelivered).toHaveClass('circle');
    expect(badgeDelivered).toHaveClass('primary');

    const deliveredChevronArea = deliveredCollapsible.querySelector(
      '[data-testid="collapsible-chevron-btn"]'
    );
    expect(deliveredChevronArea).toBeInTheDocument();
    expect(deliveredChevronArea).toContainElement(badgeDelivered);

    // Toggle expand for delivered section
    const deliveredTrigger = deliveredCollapsible.querySelector('.hc-collapsible-trigger')!;
    expect(deliveredTrigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(deliveredTrigger);
    expect(deliveredTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(deliveredCollapsible).toHaveClass('is-open');

    // Toggle back to collapse
    fireEvent.click(deliveredTrigger);
    expect(deliveredTrigger).toHaveAttribute('aria-expanded', 'false');
    expect(deliveredCollapsible).toHaveClass('is-closed');
  });

  it('manages extended FAB lifecycle across item selection, view mode toggle, sheet close, and date change', async () => {
    render(<BookingsPage />);

    // Bottom toolbar is removed
    expect(screen.queryByTestId('floating-bottom-toolbar')).not.toBeInTheDocument();
    // Standalone + create FAB is removed
    expect(screen.queryByTestId('bookings-add-fab')).not.toBeInTheDocument();

    // Select unbooked AVL01
    const selectBtn = screen.getByRole('button', { name: /เลือกชุด AVL01/i });
    fireEvent.click(selectBtn);

    // FAB is visible with "จอง 1 ชุด"
    const bookFab = screen.getByTestId('bookings-action-fab');
    expect(bookFab).toBeInTheDocument();
    expect(bookFab).toHaveTextContent('จอง 1 ชุด');
    expect(bookFab).toHaveClass('hc-booking-action-fab');

    // Switch to orders view -> FAB must be hidden
    const toggleToOrdersBtn = screen.getByRole('button', { name: /สลับเป็นมุมมองใบจอง/i });
    fireEvent.click(toggleToOrdersBtn);
    expect(screen.queryByTestId('bookings-action-fab')).not.toBeInTheDocument();

    // Switch back to items view -> FAB is visible again
    const toggleToItemsBtn = screen.getByRole('button', { name: /สลับเป็นมุมมองรายชุด/i });
    fireEvent.click(toggleToItemsBtn);
    expect(screen.getByTestId('bookings-action-fab')).toBeInTheDocument();

    // Click FAB to open BookingSheet
    fireEvent.click(screen.getByTestId('bookings-action-fab'));
    expect(screen.getByRole('dialog', { name: /สร้างการจองใหม่/i })).toBeInTheDocument();

    // Close the sheet via Step 2 "ย้อนกลับ" button
    const prevBtn = screen.getByTestId('wizard-prev-step-2');
    fireEvent.click(prevBtn);

    // Sheet closes, but selection is retained and FAB remains
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /สร้างการจองใหม่/i })).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('bookings-action-fab')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /เลือกแล้ว AVL01/i })).toBeInTheDocument();

    // Changing date via BookingDateBar clears selection and hides FAB
    fireEvent.click(screen.getByRole('button', { name: /วันถัดไป/i }));
    expect(screen.queryByTestId('bookings-action-fab')).not.toBeInTheDocument();
  });

  it('switches to dedicated top search toolbar on search FAB click, filters items, preserves query on back FAB, and supports clear', () => {
    render(<BookingsPage />);

    // In normal state, top search FAB is present on the right
    const searchFab = screen.getByTestId('bookings-search-fab');
    expect(searchFab).toBeInTheDocument();
    expect(screen.getByTestId('bookings-date-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('bookings-search-bar')).not.toBeInTheDocument();

    // Clicking search FAB opens dedicated search toolbar
    fireEvent.click(searchFab);
    expect(screen.getByTestId('bookings-search-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('bookings-date-bar')).not.toBeInTheDocument();

    // Search input is focused and accepts query
    const searchInput = screen.getByTestId('bookings-search-input');
    expect(searchInput).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: 'AVL01' } });

    // Filtered result: AVL01 is visible, others are filtered out
    expect(screen.getByTestId('inventory-booking-card-AVL01')).toBeInTheDocument();
    expect(screen.queryByTestId('inventory-booking-card-DIA01')).not.toBeInTheDocument();

    // Clicking Back FAB collapses search toolbar back to date toolbar while preserving query
    const backFab = screen.getByTestId('bookings-search-back-fab');
    expect(backFab).toBeInTheDocument();
    fireEvent.click(backFab);

    // Normal date bar returns
    expect(screen.getByTestId('bookings-date-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('bookings-search-bar')).not.toBeInTheDocument();

    // Active query indicator dot is shown on search FAB
    expect(screen.getByTestId('search-active-dot')).toBeInTheDocument();
    // Result is still filtered
    expect(screen.getByTestId('inventory-booking-card-AVL01')).toBeInTheDocument();
    expect(screen.queryByTestId('inventory-booking-card-DIA01')).not.toBeInTheDocument();

    // Reopen search and clear query
    fireEvent.click(screen.getByTestId('bookings-search-fab'));
    const clearBtn = screen.getByTestId('bookings-search-clear-btn');
    fireEvent.click(clearBtn);

    // After clear, all items are visible again
    expect(screen.getByTestId('inventory-booking-card-AVL01')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-booking-card-DIA01')).toBeInTheDocument();
  });

  it('prevents page scroll Y jumping and uses preventScroll when toggling search mode', () => {
    const scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy;

    // Simulate scrolled down position
    Object.defineProperty(window, 'scrollY', { value: 450, writable: true, configurable: true });

    // Mock focus to simulate browser auto-scrolling to top on input focus
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (
      this: HTMLElement
    ) {
      if (this.tagName.toLowerCase() === 'input') {
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
      }
    });

    render(<BookingsPage />);

    const searchFab = screen.getByTestId('bookings-search-fab');
    fireEvent.click(searchFab);

    // Search input should have received focus with preventScroll: true
    const searchInput = screen.getByTestId('bookings-search-input');
    expect(searchInput).toBeInTheDocument();
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

    // Synchronous layout restoration should have detected the focus displacement (0 !== 450) and restored it
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 450, behavior: 'instant' });

    // Reset scrollY to simulate user at 450
    Object.defineProperty(window, 'scrollY', { value: 450, writable: true, configurable: true });

    // Test clear button refocuses search input with preventScroll: true
    fireEvent.change(searchInput, { target: { value: 'test' } });
    const clearBtn = screen.getByTestId('bookings-search-clear-btn');
    fireEvent.click(clearBtn);
    expect(focusSpy).toHaveBeenLastCalledWith({ preventScroll: true });

    // Closing search via Back FAB
    const backFab = screen.getByTestId('bookings-search-back-fab');
    fireEvent.click(backFab);

    // Focus restored to search FAB with preventScroll: true
    expect(screen.getByTestId('bookings-search-fab')).toBeInTheDocument();
    expect(focusSpy).toHaveBeenLastCalledWith({ preventScroll: true });

    // Reopen and test closing with Escape key
    fireEvent.click(screen.getByTestId('bookings-search-fab'));
    const reopenedInput = screen.getByTestId('bookings-search-input');
    fireEvent.keyDown(reopenedInput, { key: 'Escape' });

    expect(screen.getByTestId('bookings-search-fab')).toBeInTheDocument();
    expect(focusSpy).toHaveBeenLastCalledWith({ preventScroll: true });

    focusSpy.mockRestore();
  });

  it('supports selecting multiple outfits, updating FAB count, and clears selection upon successful submission', async () => {
    render(<BookingsPage />);

    // Select AVL01
    const avl01Btn = screen.getByRole('button', { name: /เลือกชุด AVL01/i });
    fireEvent.click(avl01Btn);
    expect(screen.getByTestId('bookings-action-fab')).toHaveTextContent('จอง 1 ชุด');

    // Select AVL02
    const avl02Btn = screen.getByRole('button', { name: /เลือกชุด AVL02/i });
    fireEvent.click(avl02Btn);
    expect(screen.getByTestId('bookings-action-fab')).toHaveTextContent('จอง 2 ชุด');

    // Deselect AVL01
    const avl01SelectedBtn = screen.getByRole('button', { name: /เลือกแล้ว AVL01/i });
    fireEvent.click(avl01SelectedBtn);
    expect(screen.getByTestId('bookings-action-fab')).toHaveTextContent('จอง 1 ชุด');

    // Re-select AVL01
    fireEvent.click(screen.getByRole('button', { name: /เลือกชุด AVL01/i }));
    expect(screen.getByTestId('bookings-action-fab')).toHaveTextContent('จอง 2 ชุด');

    // Click FAB to open BookingSheet
    fireEvent.click(screen.getByTestId('bookings-action-fab'));
    const dialog = screen.getByRole('dialog', { name: /สร้างการจองใหม่/i });
    expect(dialog).toBeInTheDocument();

    // Select customer on Step 2
    const customerInput = within(dialog).getByLabelText(/ค้นหาลูกค้า/i);
    fireEvent.focus(customerInput);
    fireEvent.click(within(dialog).getByText('คุณพลอย รัตนากร'));

    // Advance to Step 3
    fireEvent.click(within(dialog).getByTestId('wizard-next-step-2'));

    // Confirm & Submit booking
    fireEvent.click(within(dialog).getByTestId('wizard-submit-booking'));

    // Sheet closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /สร้างการจองใหม่/i })).not.toBeInTheDocument();
    });

    // Selection is cleared and extended FAB is hidden
    expect(screen.queryByTestId('bookings-action-fab')).not.toBeInTheDocument();
  });
});
