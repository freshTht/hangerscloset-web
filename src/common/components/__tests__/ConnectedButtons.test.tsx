import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectedButtons } from '../ConnectedButtons';

describe('ConnectedButtons Component', () => {
  const items = [
    { value: 'items', label: 'รายชุด', icon: 'checkroom', ariaLabel: 'สลับเป็นมุมมองรายชุด' },
    { value: 'orders', label: 'ใบจอง', icon: 'receipt_long', ariaLabel: 'สลับเป็นมุมมองใบจอง' },
  ];

  it('renders all buttons with correct labels and icons', () => {
    render(
      <ConnectedButtons
        value="items"
        onChange={vi.fn()}
        items={items}
        ariaLabel="เลือกมุมมอง"
        testId="test-connected-buttons"
      />
    );

    const group = screen.getByTestId('test-connected-buttons');
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute('aria-label', 'เลือกมุมมอง');

    expect(screen.getByText('รายชุด')).toBeInTheDocument();
    expect(screen.getByText('ใบจอง')).toBeInTheDocument();
    expect(screen.getByText('checkroom')).toBeInTheDocument();
    expect(screen.getByText('receipt_long')).toBeInTheDocument();
  });

  it('marks active item with active class and aria-pressed=true', () => {
    render(
      <ConnectedButtons
        value="orders"
        onChange={vi.fn()}
        items={items}
      />
    );

    const itemsBtn = screen.getByRole('button', { name: /สลับเป็นมุมมองรายชุด/i });
    const ordersBtn = screen.getByRole('button', { name: /สลับเป็นมุมมองใบจอง/i });

    expect(ordersBtn).toHaveClass('active');
    expect(ordersBtn).toHaveAttribute('aria-pressed', 'true');

    expect(itemsBtn).not.toHaveClass('active');
    expect(itemsBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange when clicking an unselected option', () => {
    const handleChange = vi.fn();
    render(
      <ConnectedButtons
        value="items"
        onChange={handleChange}
        items={items}
      />
    );

    const ordersBtn = screen.getByRole('button', { name: /สลับเป็นมุมมองใบจอง/i });
    fireEvent.click(ordersBtn);

    expect(handleChange).toHaveBeenCalledWith('orders');
  });

  it('does not call onChange when clicking the currently active option', () => {
    const handleChange = vi.fn();
    render(
      <ConnectedButtons
        value="items"
        onChange={handleChange}
        items={items}
      />
    );

    const itemsBtn = screen.getByRole('button', { name: /สลับเป็นมุมมองรายชุด/i });
    fireEvent.click(itemsBtn);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('does not call onChange when clicking a disabled option', () => {
    const handleChange = vi.fn();
    const itemsWithDisabled = [
      { value: 'items', label: 'รายชุด' },
      { value: 'orders', label: 'ใบจอง', disabled: true },
    ];
    render(
      <ConnectedButtons
        value="items"
        onChange={handleChange}
        items={itemsWithDisabled}
      />
    );

    const ordersBtn = screen.getByRole('button', { name: /ใบจอง/i });
    expect(ordersBtn).toBeDisabled();
    fireEvent.click(ordersBtn);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('assigns correct rounding classes for Beer CSS connected styling', () => {
    const threeItems = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
    ];
    render(
      <ConnectedButtons
        value="b"
        onChange={vi.fn()}
        items={threeItems}
      />
    );

    const btnA = screen.getByRole('button', { name: 'A' });
    const btnB = screen.getByRole('button', { name: 'B' });
    const btnC = screen.getByRole('button', { name: 'C' });

    expect(btnA).toHaveClass('left-round');
    expect(btnB).toHaveClass('no-round');
    expect(btnC).toHaveClass('right-round');
  });
});
