import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LazyImage } from '../LazyImage';

describe('LazyImage Component', () => {
  let intersectionCallbacks: ((entries: IntersectionObserverEntry[]) => void)[] = [];
  let observedElements: Element[] = [];

  beforeEach(() => {
    intersectionCallbacks = [];
    observedElements = [];

    // Mock IntersectionObserver with a class constructor
    class MockIntersectionObserver {
      constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
        intersectionCallbacks.push(callback);
      }
      observe = vi.fn((el: Element) => {
        observedElements.push(el);
      });
      unobserve = vi.fn();
      disconnect = vi.fn();
    }

    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders skeleton placeholder before the image is in view', () => {
    const { container } = render(
      <LazyImage src="https://example.com/test1.jpg" alt="Test dress" />
    );

    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toBeInTheDocument();
    // Image should not yet be mounted
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('mounts image when intersection observer reports intersecting', () => {
    render(<LazyImage src="https://example.com/test2.jpg" alt="Test dress 2" />);

    // Trigger intersection
    expect(intersectionCallbacks.length).toBeGreaterThan(0);
    act(() => {
      intersectionCallbacks[0]([
        {
          isIntersecting: true,
          target: observedElements[0],
        } as unknown as IntersectionObserverEntry,
      ]);
    });

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/test2.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('transitions to loaded state when image onLoad fires', () => {
    const onLoadSpy = vi.fn();
    const { container } = render(
      <LazyImage
        src="https://example.com/test3.jpg"
        alt="Test dress 3"
        onLoad={onLoadSpy}
      />
    );

    // Trigger intersection
    act(() => {
      intersectionCallbacks[0]([
        {
          isIntersecting: true,
          target: observedElements[0],
        } as unknown as IntersectionObserverEntry,
      ]);
    });

    const img = screen.getByRole('img');
    fireEvent.load(img);

    expect(onLoadSpy).toHaveBeenCalledTimes(1);
    // Skeleton should now be removed
    expect(container.querySelector('.skeleton')).not.toBeInTheDocument();
    expect(img).toHaveStyle({ opacity: '1' });
  });

  it('displays fallback state if image fails to load', () => {
    const onErrorSpy = vi.fn();
    render(
      <LazyImage
        src="https://example.com/test-fail.jpg"
        alt="Failing image"
        fallbackIcon="checkroom"
        onError={onErrorSpy}
      />
    );

    // Trigger intersection
    act(() => {
      intersectionCallbacks[0]([
        {
          isIntersecting: true,
          target: observedElements[0],
        } as unknown as IntersectionObserverEntry,
      ]);
    });

    const img = screen.getByRole('img');
    fireEvent.error(img);

    expect(onErrorSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('ไม่มีรูปภาพ')).toBeInTheDocument();
  });

  it('immediately shows cached image without re-showing skeleton', () => {
    // 1st render & load
    const { unmount } = render(
      <LazyImage src="https://example.com/cached.jpg" alt="Cached dress" />
    );
    act(() => {
      intersectionCallbacks[0]([
        {
          isIntersecting: true,
          target: observedElements[0],
        } as unknown as IntersectionObserverEntry,
      ]);
    });
    fireEvent.load(screen.getByRole('img'));
    unmount();

    // 2nd render of same src
    const { container } = render(
      <LazyImage src="https://example.com/cached.jpg" alt="Cached dress" />
    );
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(container.querySelector('.skeleton')).not.toBeInTheDocument();
  });
});
