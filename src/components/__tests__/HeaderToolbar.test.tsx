import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeaderToolbar, ToolbarDivider } from '../HeaderToolbar';

describe('HeaderToolbar Component', () => {
  it('renders BeerCSS toolbar element with secondary-container and testId', () => {
    render(
      <HeaderToolbar testId="test-toolbar">
        <button type="button">Action</button>
      </HeaderToolbar>
    );

    const toolbar = screen.getByTestId('test-toolbar');
    expect(toolbar).toBeInTheDocument();
    expect(toolbar.tagName.toLowerCase()).toBe('nav');
    expect(toolbar).toHaveClass('toolbar');
    expect(toolbar).toHaveClass('secondary-container');
    expect(toolbar).toHaveClass('medium-elevate');
    expect(toolbar).toHaveClass('hc-header-toolbar');
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('supports standard variant and elevated=false', () => {
    render(
      <HeaderToolbar testId="test-toolbar-standard" variant="standard" elevated={false}>
        <span>Standard Content</span>
      </HeaderToolbar>
    );

    const toolbar = screen.getByTestId('test-toolbar-standard');
    expect(toolbar).toHaveClass('surface-container');
    expect(toolbar).not.toHaveClass('secondary-container');
    expect(toolbar).not.toHaveClass('medium-elevate');
  });

  it('wraps toolbar in sticky wrapper by default', () => {
    const { container } = render(
      <HeaderToolbar testId="test-toolbar">
        <span>Content</span>
      </HeaderToolbar>
    );

    const wrapper = container.querySelector('.hc-header-toolbar-sticky-wrapper');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toContainElement(screen.getByTestId('test-toolbar'));
  });

  it('renders without sticky wrapper when sticky=false', () => {
    const { container } = render(
      <HeaderToolbar testId="test-toolbar" sticky={false}>
        <span>Content</span>
      </HeaderToolbar>
    );

    const wrapper = container.querySelector('.hc-header-toolbar-sticky-wrapper');
    expect(wrapper).not.toBeInTheDocument();
    expect(screen.getByTestId('test-toolbar')).toBeInTheDocument();
  });

  it('renders ToolbarDivider with proper accessibility role', () => {
    render(<ToolbarDivider testId="my-divider" />);
    const divider = screen.getByTestId('my-divider');
    expect(divider).toBeInTheDocument();
    expect(divider).toHaveClass('hc-toolbar-divider');
    expect(divider).toHaveAttribute('role', 'separator');
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
  });
});
