import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState Component', () => {
  it('renders icon, title, and description cleanly in vertical alignment', () => {
    render(
      <EmptyState
        testId="test-empty-state"
        icon="search_off"
        title="ไม่พบรายการ"
        description="ลองเปลี่ยนคำค้นหาอีกครั้ง"
      />
    );

    expect(screen.getByTestId('test-empty-state')).toBeInTheDocument();
    expect(screen.getByText('ไม่พบรายการ')).toBeInTheDocument();
    expect(screen.getByText('ลองเปลี่ยนคำค้นหาอีกครั้ง')).toBeInTheDocument();
    expect(screen.getByText('search_off')).toBeInTheDocument();
  });

  it('renders primary and secondary action buttons with click callbacks', () => {
    const onAction = vi.fn();
    const onSecondaryAction = vi.fn();

    render(
      <EmptyState
        icon="event_note"
        title="ไม่มีข้อมูล"
        actionText="สร้างรายการ"
        actionIcon="add"
        onAction={onAction}
        secondaryActionText="รีเซ็ต"
        secondaryActionIcon="restart_alt"
        onSecondaryAction={onSecondaryAction}
      />
    );

    const primaryBtn = screen.getByRole('button', { name: /สร้างรายการ/i });
    const secondaryBtn = screen.getByRole('button', { name: /รีเซ็ต/i });

    expect(primaryBtn).toBeInTheDocument();
    expect(secondaryBtn).toBeInTheDocument();

    fireEvent.click(primaryBtn);
    expect(onAction).toHaveBeenCalledTimes(1);

    fireEvent.click(secondaryBtn);
    expect(onSecondaryAction).toHaveBeenCalledTimes(1);
  });
});
