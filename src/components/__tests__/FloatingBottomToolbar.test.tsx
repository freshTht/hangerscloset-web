import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FloatingBottomToolbar } from '../FloatingBottomToolbar';

describe('FloatingBottomToolbar Component', () => {
  it('renders status, divider, actions, and default paired FAB', () => {
    const handleFabClick = vi.fn();

    render(
      <FloatingBottomToolbar
        testId="test-floating-toolbar"
        status={<span>43 ชุด</span>}
        actions={
          <button type="button" aria-label="ค้นหา">
            <i>search</i>
          </button>
        }
        onFabClick={handleFabClick}
        fabAriaLabel="เพิ่มรายการใหม่"
      />
    );

    // Main container
    const container = screen.getByTestId('test-floating-toolbar');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('hc-floating-bottom-bar-container');

    // Status and divider
    expect(screen.getByText('43 ชุด')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();

    // Action button
    expect(screen.getByRole('button', { name: 'ค้นหา' })).toBeInTheDocument();

    // Paired FAB
    const fab = screen.getByRole('button', { name: 'เพิ่มรายการใหม่' });
    expect(fab).toBeInTheDocument();
    expect(fab).toHaveClass('hc-floating-bottom-fab');
    expect(fab).toHaveClass('primary');

    fireEvent.click(fab);
    expect(handleFabClick).toHaveBeenCalledTimes(1);
  });

  it('renders without status and without separator when status prop is omitted', () => {
    render(
      <FloatingBottomToolbar
        actions={
          <button type="button" aria-label="ค้นหา">
            <i>search</i>
          </button>
        }
      />
    );

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ค้นหา' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'เพิ่มรายการใหม่' })).not.toBeInTheDocument();
  });

  it('supports custom FAB element', () => {
    render(
      <FloatingBottomToolbar
        actions={<span>Action</span>}
        fab={<button type="button" data-testid="custom-fab">Custom FAB</button>}
      />
    );

    expect(screen.getByTestId('custom-fab')).toBeInTheDocument();
  });
});
