import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Collapsible } from '../Collapsible';

describe('Common Collapsible Component', () => {
  it('renders title, leadingSlot, badgeSlot, and children with open state by default', () => {
    render(
      <Collapsible
        title="จองแล้ว"
        leadingSlot={<span data-testid="leading-icon">🏷️</span>}
        badgeSlot={<span data-testid="count-badge">5</span>}
        testId="test-collapsible"
      >
        <div data-testid="collapsible-content">เนื้อหาภายใน</div>
      </Collapsible>
    );

    const section = screen.getByTestId('test-collapsible');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('is-open');

    expect(screen.getByText('จองแล้ว')).toBeInTheDocument();
    expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
    expect(screen.getByTestId('count-badge')).toHaveTextContent('5');
    expect(screen.getByTestId('collapsible-content')).toBeInTheDocument();

    const chevronBtn = screen.getByTestId('collapsible-chevron-btn');
    expect(chevronBtn).toBeInTheDocument();
    expect(chevronBtn).toContainElement(screen.getByTestId('count-badge'));

    const trigger = screen.getByRole('button', { name: /จองแล้ว/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggles open/close state when trigger button is clicked (uncontrolled)', () => {
    const handleOpenChange = vi.fn();
    render(
      <Collapsible
        title="รอส่งมอบ"
        defaultOpen={true}
        onOpenChange={handleOpenChange}
        testId="toggle-collapsible"
      >
        <div>Content</div>
      </Collapsible>
    );

    const trigger = screen.getByRole('button', { name: /รอส่งมอบ/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Click to collapse
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(handleOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('toggle-collapsible')).toHaveClass('is-closed');

    // Click to expand again
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(handleOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('toggle-collapsible')).toHaveClass('is-open');
  });

  it('respects controlled open prop', () => {
    const handleOpenChange = vi.fn();
    const { rerender } = render(
      <Collapsible
        open={false}
        title="ส่งซัก"
        onOpenChange={handleOpenChange}
        testId="controlled-collapsible"
      >
        <div>Content</div>
      </Collapsible>
    );

    const trigger = screen.getByRole('button', { name: /ส่งซัก/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('controlled-collapsible')).toHaveClass('is-closed');

    // Click triggers onOpenChange callback with next state
    fireEvent.click(trigger);
    expect(handleOpenChange).toHaveBeenCalledWith(true);

    // Rerender with open=true
    rerender(
      <Collapsible
        open={true}
        title="ส่งซัก"
        onOpenChange={handleOpenChange}
        testId="controlled-collapsible"
      >
        <div>Content</div>
      </Collapsible>
    );
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('controlled-collapsible')).toHaveClass('is-open');
  });

  it('does not toggle when disabled', () => {
    const handleOpenChange = vi.fn();
    render(
      <Collapsible
        title="ปิดการใช้งาน"
        disabled
        onOpenChange={handleOpenChange}
      >
        <div>Content</div>
      </Collapsible>
    );

    const trigger = screen.getByRole('button', { name: /ปิดการใช้งาน/i });
    expect(trigger).toBeDisabled();

    fireEvent.click(trigger);
    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('stops propagation when clicking headerActionSlot', () => {
    const handleActionClick = vi.fn();
    const handleOpenChange = vi.fn();

    render(
      <Collapsible
        title="ส่วนที่มีปุ่มพิเศษ"
        headerActionSlot={
          <button type="button" onClick={handleActionClick}>
            ปุ่มพิเศษ
          </button>
        }
        onOpenChange={handleOpenChange}
      >
        <div>Content</div>
      </Collapsible>
    );

    const actionBtn = screen.getByRole('button', { name: 'ปุ่มพิเศษ' });
    fireEvent.click(actionBtn);

    expect(handleActionClick).toHaveBeenCalledTimes(1);
    expect(handleOpenChange).not.toHaveBeenCalled();
  });
});
