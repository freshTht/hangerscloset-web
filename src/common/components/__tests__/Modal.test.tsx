import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';

describe('Modal Component', () => {
  it('renders correctly when visible with children', () => {
    const onClose = vi.fn();
    render(
      <Modal visible={true} onClose={onClose} ariaLabel="Test Modal" testId="test-modal">
        <p>Modal Content</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog', { name: 'Test Modal' });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveClass('active');
    expect(dialog).toHaveAttribute('open');
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('sets aria-hidden="true" and lacks active class when visible is false', () => {
    const onClose = vi.fn();
    render(
      <Modal visible={false} onClose={onClose} id="hidden-modal" testId="test-modal">
        <p>Hidden Content</p>
      </Modal>
    );

    const dialog = screen.getByTestId('test-modal');
    expect(dialog).not.toHaveClass('active');
    expect(dialog).toHaveAttribute('aria-hidden', 'true');
    expect(dialog).not.toHaveAttribute('open');
  });

  it('renders floating variant without position classes', () => {
    render(
      <Modal visible={true} variant="floating" onClose={vi.fn()} testId="floating-modal">
        <p>Floating</p>
      </Modal>
    );

    const dialog = screen.getByTestId('floating-modal');
    expect(dialog).toHaveClass('hc-modal-dialog-floating');
    expect(dialog).not.toHaveClass('bottom');
  });

  it('renders bottom-sheet variant with responsive classes', () => {
    render(
      <Modal visible={true} variant="bottom-sheet" onClose={vi.fn()} testId="sheet-modal">
        <p>Sheet</p>
      </Modal>
    );

    const dialog = screen.getByTestId('sheet-modal');
    // On jsdom desktop environment, desktopSideSheet defaults to true
    expect(dialog).toHaveClass('right');
    expect(dialog).toHaveClass('m');
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal
        visible={true}
        onClose={onClose}
        overlayTestId="test-overlay"
      >
        <p>Content</p>
      </Modal>
    );

    fireEvent.click(screen.getByTestId('test-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal visible={true} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
