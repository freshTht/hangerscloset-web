import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InventoryCard } from '../InventoryCard';

describe('Common InventoryCard Component', () => {
  const sampleItem = {
    id: 'inv-1',
    code: 'DIA01',
    name: 'Dieu Ann Dress',
    brand: 'Dieu Ann',
    color: 'Beige',
    size: 'S',
    imageUrl: '',
    conditionNote: 'มีเข็มกลัดเพชรให้',
  };

  it('renders item code, name, default attributes, and condition note', () => {
    render(<InventoryCard item={sampleItem} testId="common-inv-card" />);

    const card = screen.getByTestId('common-inv-card');
    expect(card).toBeInTheDocument();
    expect(screen.getByText('DIA01')).toBeInTheDocument();
    expect(screen.getByText('Dieu Ann Dress')).toBeInTheDocument();
    expect(screen.getByText('Dieu Ann')).toBeInTheDocument();
    expect(screen.getByText('Beige')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('มีเข็มกลัดเพชรให้')).toBeInTheDocument();
    const noteEl = card.querySelector('.hc-common-inv-card-note');
    expect(noteEl).toHaveClass('round');
    expect(noteEl).toHaveClass('secondary-container');
    expect(noteEl?.querySelector('i')).toHaveTextContent('sticky_note_2');
  });

  it('renders component slots (badge, headerAction, footerLeft, footerRight, bottom)', () => {
    render(
      <InventoryCard
        item={sampleItem}
        badgeSlot={<span data-testid="slot-badge">ส่งมอบแล้ว</span>}
        headerActionSlot={<button type="button">แก้ไข</button>}
        footerLeftSlot={<span data-testid="slot-price">฿785</span>}
        footerRightSlot={<button type="button">ดูข้อเสนอ</button>}
        bottomSlot={<span data-testid="slot-bottom">คำเตือนเพิ่มเติม</span>}
      />
    );

    expect(screen.getByTestId('slot-badge')).toHaveTextContent('ส่งมอบแล้ว');
    expect(screen.getByRole('button', { name: 'แก้ไข' })).toBeInTheDocument();
    expect(screen.getByTestId('slot-price')).toHaveTextContent('฿785');
    expect(screen.getByRole('button', { name: 'ดูข้อเสนอ' })).toBeInTheDocument();
    expect(screen.getByTestId('slot-bottom')).toHaveTextContent('คำเตือนเพิ่มเติม');
  });

  it('applies size, variant, selected, conflict classes and handles onClick', () => {
    const handleClick = vi.fn();
    render(
      <InventoryCard
        item={sampleItem}
        size="sm"
        variant="outlined"
        selected
        hasConflict
        onClick={handleClick}
        testId="interactive-inv-card"
      />
    );

    const card = screen.getByTestId('interactive-inv-card');
    expect(card).toHaveClass('hc-common-inv-card-sm');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('hc-common-inv-card-selected');

    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('defaults to small-round and supports rounding prop', () => {
    const { rerender } = render(
      <InventoryCard item={sampleItem} testId="rounding-card" />
    );
    const card = screen.getByTestId('rounding-card');
    expect(card).toHaveClass('small-round');

    rerender(
      <InventoryCard item={sampleItem} rounding="round" testId="rounding-card" />
    );
    expect(card).toHaveClass('round');
  });
});
