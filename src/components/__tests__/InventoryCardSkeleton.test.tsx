import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { InventoryCardSkeleton } from '../InventoryCardSkeleton';

describe('InventoryCardSkeleton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders desktop vertical skeleton layout when width > 600px', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<InventoryCardSkeleton />);

    const article = container.querySelector('article');
    expect(article).toBeInTheDocument();
    expect(article).toHaveClass('vertical');

    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders mobile horizontal row skeleton layout when width <= 600px', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<InventoryCardSkeleton />);

    const article = container.querySelector('article');
    expect(article).toBeInTheDocument();
    expect(article).toHaveClass('row');

    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
