import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InventoryCard } from '../InventoryCard';
import { InventoryPage } from '../../pages/InventoryPage';
import type { InventoryItem } from '../../types/inventory';

const MOCK_ITEMS: InventoryItem[] = [
  {
    id: 'item-1',
    code: 'AVL01',
    name: 'Avaalene Blue Dress',
    brand: 'Avaalene',
    color: 'Blue',
    size: 'S',
    status: 'available',
    tags: ['เดรส', 'ไปทะเล'],
    owner: 'คุณแอน',
    imageUrl: 'https://example.com/1.jpg',
    rentalPrices: [
      { durationDays: 1, price: 300 },
      { durationDays: 3, price: 500 },
      { durationDays: 5, price: 700 },
    ],
  },
  {
    id: 'item-2',
    code: 'AVL02',
    name: 'Lululala Pink Set',
    brand: 'Lululala',
    color: 'Pink',
    size: 'M',
    status: 'reserved',
    tags: ['เซ็ต', 'คาเฟ่'],
    owner: 'ร้าน Hanger',
    imageUrl: 'https://example.com/2.jpg',
    rentalPrices: [
      { durationDays: 1, price: 450 },
      { durationDays: 3, price: 650 },
    ],
  },
  {
    id: 'item-3',
    code: 'AVL03',
    name: 'Fabrique Gold Gown',
    brand: 'Fabrique',
    color: 'Gold',
    size: 'L',
    status: 'laundry',
    tags: ['เดรส', 'ออกงาน'],
    owner: 'คุณบี',
    imageUrl: 'https://example.com/3.jpg',
    rentalPrices: [
      { durationDays: 1, price: 890 },
      { durationDays: 3, price: 1290 },
      { durationDays: 5, price: 1690 },
    ],
  },
];

vi.mock('../../hooks/useInventory', () => ({
  useInventory: () => ({
    items: MOCK_ITEMS,
    loading: false,
    error: null,
    provider: 'mock',
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('InventoryCard (Simplified)', () => {
  it('does not render status badge and renders price tiers as non-interactive display elements', () => {
    const onEdit = vi.fn();
    const { container } = render(
      <InventoryCard item={MOCK_ITEMS[0]} onEdit={onEdit} />
    );

    // No status badges
    expect(screen.queryByText('พร้อมเช่า')).not.toBeInTheDocument();
    expect(screen.queryByText('จองแล้ว')).not.toBeInTheDocument();
    expect(screen.queryByText('ส่งซัก')).not.toBeInTheDocument();
    expect(container.querySelector('.hc-status-badge')).toBeNull();

    // Price tiers are displayed clearly
    expect(screen.getByTestId('price-tier-1')).toHaveTextContent('1 วัน');
    expect(screen.getByTestId('price-tier-1')).toHaveTextContent('฿300');
    expect(screen.getByTestId('price-tier-3')).toHaveTextContent('3 วัน');
    expect(screen.getByTestId('price-tier-3')).toHaveTextContent('฿500');
    expect(screen.getByTestId('price-tier-5')).toHaveTextContent('5 วัน');
    expect(screen.getByTestId('price-tier-5')).toHaveTextContent('฿700');

    // Price tier group contains no <button> elements
    const priceGroup = screen.getByTestId('price-tiers-group');
    expect(priceGroup.querySelectorAll('button').length).toBe(0);

    // Edit button still works
    const editBtn = screen.getByRole('button', { name: 'แก้ไข AVL01' });
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(MOCK_ITEMS[0]);
  });
});

describe('InventoryPage Search, Filter & Sort', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('expands floating search bar, filters items by keyword, and updates item count', () => {
    render(<InventoryPage />);

    expect(screen.getByTestId('inventory-count-badge')).toHaveTextContent('3 ชุด');

    // Open expandable search input
    fireEvent.click(screen.getByRole('button', { name: 'ค้นหา' }));
    const searchInput = screen.getByLabelText('ค้นหาชุดในคลัง');
    expect(searchInput).toBeInTheDocument();

    // Type keyword matching only item 2
    fireEvent.change(searchInput, { target: { value: 'Lululala' } });

    expect(screen.getByTestId('inventory-count-badge')).toHaveTextContent('1/3 ชุด');
    expect(screen.getByText('Lululala Pink Set')).toBeInTheDocument();
    expect(screen.queryByText('Avaalene Blue Dress')).not.toBeInTheDocument();

    // Active filter chip appears at top of grid and can dismiss the search
    const dismissSearchChip = screen.getByRole('button', {
      name: 'ลบคำค้นหา Lululala',
    });
    fireEvent.click(dismissSearchChip);

    expect(screen.getByTestId('inventory-count-badge')).toHaveTextContent('3 ชุด');
  });

  it('opens filter sheet via top bar button, applies multi-facet filters, and shows active count', () => {
    render(<InventoryPage />);

    fireEvent.click(screen.getByTestId('btn-filters'));
    expect(
      screen.getByRole('dialog', { name: 'ตัวกรองสินค้า' })
    ).toBeInTheDocument();

    // Select tag 'เดรส' (matches item-1 and item-3)
    fireEvent.click(screen.getByTestId('filter-tag-เดรส'));
    expect(screen.getByTestId('inventory-count-badge')).toHaveTextContent('2/3 ชุด');

    // Add size 'S' (narrows down to item-1 only)
    fireEvent.click(screen.getByTestId('filter-size-S'));
    expect(screen.getByTestId('inventory-count-badge')).toHaveTextContent('1/3 ชุด');
    expect(screen.getByText('Avaalene Blue Dress')).toBeInTheDocument();
    expect(screen.queryByText('Fabrique Gold Gown')).not.toBeInTheDocument();

    // Filter button shows the number of active filters
    expect(screen.getByTestId('filter-active-count')).toHaveTextContent('2');

    // Dismiss the tag filter chip from the active bar
    fireEvent.click(screen.getByRole('button', { name: 'ลบตัวกรองแท็ก เดรส' }));
    expect(screen.getByTestId('filter-active-count')).toHaveTextContent('1');

    // Toggle size off again
    fireEvent.click(screen.getByTestId('filter-size-S'));
    expect(screen.getByTestId('inventory-count-badge')).toHaveTextContent('3 ชุด');
    expect(screen.getByText('Fabrique Gold Gown')).toBeInTheDocument();
  });

  it('opens sort dialog and reorders inventory items', () => {
    render(<InventoryPage />);

    // Default order: AVL01, AVL02, AVL03
    const initialHeadings = screen
      .getAllByRole('heading', { level: 6 })
      .map((h) => h.textContent);
    expect(initialHeadings.slice(0, 3)).toEqual([
      'Avaalene Blue Dress',
      'Lululala Pink Set',
      'Fabrique Gold Gown',
    ]);

    // Open sort dialog and pick price_desc
    fireEvent.click(screen.getByRole('button', { name: 'จัดเรียง' }));
    fireEvent.click(screen.getByTestId('sort-option-price_desc'));

    const sortedHeadings = screen
      .getAllByRole('heading', { level: 6 })
      .map((h) => h.textContent);
    expect(sortedHeadings.slice(0, 3)).toEqual([
      'Fabrique Gold Gown',
      'Lululala Pink Set',
      'Avaalene Blue Dress',
    ]);
  });

  it('shows empty filter state when no items match and resets all filters on button click', () => {
    render(<InventoryPage />);

    fireEvent.click(screen.getByRole('button', { name: 'ค้นหา' }));
    fireEvent.change(screen.getByLabelText('ค้นหาชุดในคลัง'), {
      target: { value: 'NON_EXISTENT_DRESS_XYZ' },
    });

    expect(screen.getByTestId('empty-filter-results')).toBeInTheDocument();
    expect(
      screen.getByText('ไม่พบชุดที่ตรงกับเงื่อนไขการค้นหา')
    ).toBeInTheDocument();

    // Click reset all inside empty state
    const resetButtons = screen.getAllByRole('button', {
      name: /ล้างตัวกรองทั้งหมด/,
    });
    fireEvent.click(resetButtons[resetButtons.length - 1]);

    expect(screen.queryByTestId('empty-filter-results')).not.toBeInTheDocument();
    expect(screen.getByTestId('inventory-count-badge')).toHaveTextContent('3 ชุด');
  });

  it('shows clear button only when 1 or more filter is applied and resets on click', () => {
    render(<InventoryPage />);

    // Initially, no filter is applied: clear button is not in document
    expect(screen.queryByRole('button', { name: 'เคลียร์' })).not.toBeInTheDocument();

    // Apply a search query
    fireEvent.click(screen.getByRole('button', { name: 'ค้นหา' }));
    fireEvent.change(screen.getByLabelText('ค้นหาชุดในคลัง'), {
      target: { value: 'Dress' },
    });

    // Clear button should now be visible
    const clearBtn = screen.getByRole('button', { name: 'เคลียร์' });
    expect(clearBtn).toBeInTheDocument();

    // Clicking clear resets the filters
    fireEvent.click(clearBtn);

    // After reset, clear button should disappear again
    expect(screen.queryByRole('button', { name: 'เคลียร์' })).not.toBeInTheDocument();
    expect(screen.getByTestId('inventory-count-badge')).toHaveTextContent('3 ชุด');
  });

  it('filters by brand and color from the filter sheet', () => {
    render(<InventoryPage />);

    fireEvent.click(screen.getByTestId('btn-filters'));

    fireEvent.click(screen.getByTestId('filter-brand-Avaalene'));
    expect(screen.getByTestId('inventory-count-badge')).toHaveTextContent('1/3 ชุด');
    expect(screen.getByText('Avaalene Blue Dress')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('filter-brand-Avaalene'));
    expect(screen.getByTestId('inventory-count-badge')).toHaveTextContent('3 ชุด');

    fireEvent.click(screen.getByTestId('filter-color-Blue'));
    expect(screen.getByTestId('inventory-count-badge')).toHaveTextContent('1/3 ชุด');
    expect(screen.getByText('Avaalene Blue Dress')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('filter-color-Blue'));
    expect(screen.getByTestId('inventory-count-badge')).toHaveTextContent('3 ชุด');
  });

  it('expands search and tag box via right toggle icon and filters by tag chips', () => {
    render(<InventoryPage />);

    // Click search toggle icon on the right of filter bar
    const searchToggle = screen.getByTestId('filter-bar-search-toggle');
    fireEvent.click(searchToggle);

    // Tag pills should be visible inside expanded search box
    const dressTagChip = screen.getByTestId('tag-chip-เดรส');
    expect(dressTagChip).toBeInTheDocument();

    // Click tag chip to filter
    fireEvent.click(dressTagChip);
    expect(screen.getByTestId('inventory-count-badge')).toHaveTextContent('2/3 ชุด');

    // Tag chip should show active class and chip in filter bar
    expect(screen.getByRole('button', { name: 'ลบตัวกรองแท็ก เดรส' })).toBeInTheDocument();
  });
});
