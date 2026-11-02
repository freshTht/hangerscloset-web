import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '../Skeleton';

describe('Skeleton Component', () => {
  it('renders default skeleton with hc-skeleton class and aria-hidden true', () => {
    const { container } = render(<Skeleton data-testid="test-skeleton" />);
    const el = container.querySelector('.hc-skeleton');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders shape class when shape prop is provided', () => {
    const { container } = render(<Skeleton shape="round" className="custom-test" />);
    const el = container.querySelector('.hc-skeleton');
    expect(el).toHaveClass('hc-skeleton');
    expect(el).toHaveClass('round');
    expect(el).toHaveClass('custom-test');
  });

  it('renders children and custom styles when provided', () => {
    const { getByText } = render(
      <Skeleton style={{ width: '100px' }}>
        <span>Loading text</span>
      </Skeleton>
    );
    expect(getByText('Loading text')).toBeInTheDocument();
  });
});
