import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeaderToolbar, ToolbarDivider } from '../HeaderToolbar';

describe('HeaderToolbar Component', () => {
  it('renders BeerCSS toolbar element with blur and border (outlined) by default', () => {
    render(
      <HeaderToolbar testId="test-toolbar">
        <button type="button">Action</button>
      </HeaderToolbar>
    );

    const toolbar = screen.getByTestId('test-toolbar');
    expect(toolbar).toBeInTheDocument();
    expect(toolbar.tagName.toLowerCase()).toBe('nav');
    expect(toolbar).toHaveClass('toolbar');
    expect(toolbar).toHaveClass('blur');
    expect(toolbar).toHaveClass('border');
    expect(toolbar).toHaveClass('is-outlined');
    expect(toolbar).not.toHaveClass('small-elevate');
    expect(toolbar).not.toHaveClass('medium-elevate');
    expect(toolbar).toHaveClass('hc-header-toolbar');
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('supports custom elevation (small, medium, large)', () => {
    const { rerender } = render(
      <HeaderToolbar testId="test-toolbar-elev" elevation="small">
        <span>Small Elevate</span>
      </HeaderToolbar>
    );

    const toolbar = screen.getByTestId('test-toolbar-elev');
    expect(toolbar).toHaveClass('small-elevate');

    rerender(
      <HeaderToolbar testId="test-toolbar-elev" elevation="medium">
        <span>Medium Elevate</span>
      </HeaderToolbar>
    );
    expect(toolbar).toHaveClass('medium-elevate');

    rerender(
      <HeaderToolbar testId="test-toolbar-elev" elevation="large">
        <span>Large Elevate</span>
      </HeaderToolbar>
    );
    expect(toolbar).toHaveClass('large-elevate');

    rerender(
      <HeaderToolbar testId="test-toolbar-elev" elevation="none">
        <span>No Elevate</span>
      </HeaderToolbar>
    );
    expect(toolbar).not.toHaveClass('small-elevate');
    expect(toolbar).not.toHaveClass('medium-elevate');
    expect(toolbar).not.toHaveClass('large-elevate');
  });

  it('supports outlined=false', () => {
    render(
      <HeaderToolbar testId="test-toolbar-no-border" outlined={false}>
        <span>No Border</span>
      </HeaderToolbar>
    );

    const toolbar = screen.getByTestId('test-toolbar-no-border');
    expect(toolbar).not.toHaveClass('border');
    expect(toolbar).not.toHaveClass('is-outlined');
  });

  it('supports vibrant variant', () => {
    render(
      <HeaderToolbar testId="test-toolbar-vibrant" variant="vibrant">
        <span>Vibrant Content</span>
      </HeaderToolbar>
    );

    const toolbar = screen.getByTestId('test-toolbar-vibrant');
    expect(toolbar).toHaveClass('secondary-container');
    expect(toolbar).not.toHaveClass('blur');
  });

  it('supports standard variant and elevated=false', () => {
    render(
      <HeaderToolbar testId="test-toolbar-standard" variant="standard" elevated={false}>
        <span>Standard Content</span>
      </HeaderToolbar>
    );

    const toolbar = screen.getByTestId('test-toolbar-standard');
    expect(toolbar).toHaveClass('surface-container');
    expect(toolbar).not.toHaveClass('blur');
    expect(toolbar).not.toHaveClass('small-elevate');
    expect(toolbar).not.toHaveClass('medium-elevate');
  });

  it('supports small-blur and large-blur variants', () => {
    const { rerender } = render(
      <HeaderToolbar testId="test-toolbar-blur" variant="small-blur">
        <span>Small Blur</span>
      </HeaderToolbar>
    );

    const toolbar = screen.getByTestId('test-toolbar-blur');
    expect(toolbar).toHaveClass('small-blur');
    expect(toolbar).toHaveClass('blur');

    rerender(
      <HeaderToolbar testId="test-toolbar-blur" variant="large-blur">
        <span>Large Blur</span>
      </HeaderToolbar>
    );
    expect(toolbar).toHaveClass('large-blur');
    expect(toolbar).toHaveClass('blur');
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
