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

    // Floating selection bar appears with count, price, and action FAB
    const selectionBar = screen.getByTestId('bookings-selection-bar');
    expect(selectionBar).toBeInTheDocument();
    expect(selectionBar).toHaveTextContent('เลือก 1 ชุด');
    expect(selectionBar).toHaveTextContent(/฿[0-9,]+/);

    const bookFab = screen.getByTestId('bookings-action-fab');
    expect(bookFab).toBeInTheDocument();
    expect(bookFab).toHaveTextContent('จองชุด');
    expect(bookFab.querySelector('i')).toHaveTextContent('shopping_bag');

    // Clicking extended FAB opens BookingSheet directly at Step 2 (Customer selection)
    fireEvent.click(bookFab);
    expect(screen.getByRole('dialog', { name: /สร้างการจองใหม่/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/ค้นหาลูกค้า/i)).toBeInTheDocument();
  });

  it('filters rental duration via chips in ready section and updates displayed prices dynamically', () => {
    render(<BookingsPage />);

    // Available item AVL01 defaults to 3 days price (120 / 3 วัน)
    const avlCard = screen.getByTestId('inventory-booking-card-AVL01');
    expect(within(avlCard).getByText(/฿120/)).toBeInTheDocument();
    expect(within(avlCard).getByText(/\/ 3 วัน/)).toBeInTheDocument();

    // Duration filter chips exist: 1 วัน, 3 วัน, 5 วัน
    const chip1 = screen.getByTestId('duration-filter-1');
    const chip3 = screen.getByTestId('duration-filter-3');
    const chip5 = screen.getByTestId('duration-filter-5');
    expect(chip1).toBeInTheDocument();
    expect(chip3).toBeInTheDocument();
    expect(chip5).toBeInTheDocument();
    expect(chip3).toHaveAttribute('aria-pressed', 'true');

    // Switch to 1 day
    fireEvent.click(chip1);
    expect(chip1).toHaveAttribute('aria-pressed', 'true');
    expect(chip3).toHaveAttribute('aria-pressed', 'false');
    expect(within(avlCard).getByText(/฿80/)).toBeInTheDocument();
    expect(within(avlCard).getByText(/\/ 1 วัน/)).toBeInTheDocument();

    // Switch to 5 days
    fireEvent.click(chip5);
    expect(chip5).toHaveAttribute('aria-pressed', 'true');
    expect(within(avlCard).getByText(/฿150/)).toBeInTheDocument();
    expect(within(avlCard).getByText(/\/ 5 วัน/)).toBeInTheDocument();
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

    // 'available' (ว่าง (พร้อมเช่า)) is the bottom-most section
    const allCollapsibles = document.querySelectorAll('.hc-bookings-status-collapsible');
    expect(allCollapsibles.length).toBeGreaterThan(1);
    expect(allCollapsibles[allCollapsibles.length - 1]).toBe(availableCollapsible);

    // Title is simple text with Beer CSS typography h6
    const heading = screen.getByRole('heading', { level: 6, name: 'ส่งมอบแล้ว' });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('small');
    expect(heading).toHaveClass('bold');

    // Count and chevron are inside the status-colored chip-style container in the right header section
    const badgeDelivered = screen.getByTestId('badge-count-delivered');
    expect(badgeDelivered).toBeInTheDocument();
    expect(badgeDelivered).toHaveClass('hc-collapsible-chip-count');

    const deliveredChevronArea = deliveredCollapsible.querySelector(
      '[data-testid="collapsible-chevron-btn"]'
    );
    expect(deliveredChevronArea).toBeInTheDocument();
    expect(deliveredChevronArea).toHaveClass('hc-collapsible-status-chip');
    expect(deliveredChevronArea).toHaveClass('primary');
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

  it('manages extended FAB lifecycle across item selection, sheet close, and date change', async () => {
    render(<BookingsPage />);

    // Bottom toolbar is removed
    expect(screen.queryByTestId('floating-bottom-toolbar')).not.toBeInTheDocument();
    // Standalone + create FAB is removed
    expect(screen.queryByTestId('bookings-add-fab')).not.toBeInTheDocument();

    // Select unbooked AVL01
    const selectBtn = screen.getByRole('button', { name: /เลือกชุด AVL01/i });
    fireEvent.click(selectBtn);

    // Selection bar & FAB are visible
    const selectionBar = screen.getByTestId('bookings-selection-bar');
    expect(selectionBar).toBeInTheDocument();
    expect(selectionBar).toHaveTextContent('เลือก 1 ชุด');
    expect(screen.getByTestId('bookings-clear-selection-btn')).toBeInTheDocument();

    const bookFab = screen.getByTestId('bookings-action-fab');
    expect(bookFab).toBeInTheDocument();
    expect(bookFab).toHaveTextContent('จองชุด');
    expect(bookFab).toHaveClass('hc-booking-action-fab');

    // Click FAB to open BookingSheet
    fireEvent.click(screen.getByTestId('bookings-action-fab'));
    expect(screen.getByRole('dialog', { name: /สร้างการจองใหม่/i })).toBeInTheDocument();

    // Close the sheet via "ยกเลิก" button
    const cancelBtn = within(screen.getByRole('dialog', { name: /สร้างการจองใหม่/i })).getByRole('button', { name: 'ยกเลิก' });
    fireEvent.click(cancelBtn);

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

    // Filtered result: AVL01 is visible, non-matching outfits/orders like DIA01 are filtered out
    expect(screen.getByTestId('inventory-booking-card-AVL01')).toBeInTheDocument();
    expect(screen.queryByTestId('grouped-outfit-card-DIA01')).not.toBeInTheDocument();

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
    expect(screen.queryByTestId('grouped-outfit-card-DIA01')).not.toBeInTheDocument();

    // Reopen search and clear query
    fireEvent.click(screen.getByTestId('bookings-search-fab'));
    const clearBtn = screen.getByTestId('bookings-search-clear-btn');
    fireEvent.click(clearBtn);

    // After clear, all items are visible again (AVL01 in available, DIA01 in grouped card)
    expect(screen.getByTestId('inventory-booking-card-AVL01')).toBeInTheDocument();
    expect(screen.getByTestId('grouped-outfit-card-DIA01')).toBeInTheDocument();
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
    expect(screen.getByTestId('bookings-selection-bar')).toHaveTextContent('เลือก 1 ชุด');
    expect(screen.getByTestId('bookings-action-fab')).toHaveTextContent('จองชุด');

    // Select AVL02
    const avl02Btn = screen.getByRole('button', { name: /เลือกชุด AVL02/i });
    fireEvent.click(avl02Btn);
    expect(screen.getByTestId('bookings-selection-bar')).toHaveTextContent('เลือก 2 ชุด');

    // Deselect AVL01
    const avl01SelectedBtn = screen.getByRole('button', { name: /เลือกแล้ว AVL01/i });
    fireEvent.click(avl01SelectedBtn);
    expect(screen.getByTestId('bookings-selection-bar')).toHaveTextContent('เลือก 1 ชุด');

    // Re-select AVL01
    fireEvent.click(screen.getByRole('button', { name: /เลือกชุด AVL01/i }));
    expect(screen.getByTestId('bookings-selection-bar')).toHaveTextContent('เลือก 2 ชุด');

    // Click FAB to open BookingSheet
    fireEvent.click(screen.getByTestId('bookings-action-fab'));
    const dialog = screen.getByRole('dialog', { name: /สร้างการจองใหม่/i });
    expect(dialog).toBeInTheDocument();

    // Select customer
    const customerInput = within(dialog).getByLabelText(/ค้นหาลูกค้า/i);
    fireEvent.focus(customerInput);
    fireEvent.click(within(dialog).getByText('คุณพลอย รัตนากร'));

    // Submit booking button opens confirmation modal
    fireEvent.click(within(dialog).getByTestId('submit-booking-button'));

    // Confirm booking in modal
    const confirmModal = screen.getByTestId('confirm-booking-dialog');
    expect(confirmModal).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('confirm-booking-submit'));

    // Sheet closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /สร้างการจองใหม่/i })).not.toBeInTheDocument();
    });

    // Selection is cleared and extended FAB is hidden
    expect(screen.queryByTestId('bookings-action-fab')).not.toBeInTheDocument();
  });

  it('immediately clears multi-selection when clear icon button in bottom toolbar is clicked', () => {
    render(<BookingsPage />);

    // Select CHA01
    const cha01Btn = screen.getByRole('button', { name: /เลือกชุด CHA01/i });
    fireEvent.click(cha01Btn);
    expect(screen.getByTestId('bookings-selection-bar')).toBeInTheDocument();

    // Click clear button
    const clearBtn = screen.getByTestId('bookings-clear-selection-btn');
    fireEvent.click(clearBtn);

    // Toolbar and FAB are removed, item is deselected
    expect(screen.queryByTestId('bookings-selection-bar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bookings-action-fab')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /เลือกชุด CHA01/i })).toBeInTheDocument();
  });

  it('opens BookingSheet with correct 3-day rental price without showing false discount', () => {
    render(<BookingsPage />);

    // Select CHA01 (which has 1-day: 190, 3-day: 300)
    const selectCha01Btn = screen.getByRole('button', {
      name: /เลือกชุด CHA01/i,
    });
    expect(selectCha01Btn).toBeInTheDocument();
    fireEvent.click(selectCha01Btn);

    // Click extended FAB "จอง 1 ชุด"
    const bookFab = screen.getByTestId('bookings-action-fab');
    expect(bookFab).toBeInTheDocument();
    fireEvent.click(bookFab);

    // BookingSheet opens in add mode
    const dialog = screen.getByRole('dialog', { name: /สร้างการจองใหม่/i });
    expect(dialog).toBeInTheDocument();

    // Check that CHA01 is in Card 2
    expect(within(dialog).getByText('CHA01')).toBeInTheDocument();

    // Check that rental price is auto-populated with 300 (3-day price), not 190 (1-day price)
    const priceInput = within(dialog).getByLabelText(/ราคาเช่ารวม/i);
    expect(priceInput).toHaveValue(300);
    expect(within(dialog).queryByTestId('booking-discount-text')).not.toBeInTheDocument();
  });
});
