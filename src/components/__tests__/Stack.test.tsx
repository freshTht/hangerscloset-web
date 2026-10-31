import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Stack } from '../Stack';

describe('Stack Component', () => {
  it('renders with hardcoded display: flex and defaults to column orientation', () => {
    render(<Stack data-testid="stack">Hello Stack</Stack>);
    const el = screen.getByTestId('stack');
    expect(el).toHaveStyle({ display: 'flex', flexDirection: 'column' });
    expect(el).toHaveTextContent('Hello Stack');
  });

  it('binds orientation to flex-direction: row and column', () => {
    const { rerender } = render(
      <Stack data-testid="stack" orientation="row">
        Item
      </Stack>
    );
    expect(screen.getByTestId('stack')).toHaveStyle({ flexDirection: 'row' });

    rerender(
      <Stack data-testid="stack" orientation="column">
        Item
      </Stack>
    );
    expect(screen.getByTestId('stack')).toHaveStyle({ flexDirection: 'column' });
  });

  it('maps gap options to pixel values matching Beer CSS spacing', () => {
    const { rerender } = render(
      <Stack data-testid="stack" gap="small">
        Content
      </Stack>
    );
    expect(screen.getByTestId('stack')).toHaveStyle({ gap: '8px' });

    rerender(
      <Stack data-testid="stack" gap="medium">
        Content
      </Stack>
    );
    expect(screen.getByTestId('stack')).toHaveStyle({ gap: '16px' });

    rerender(
      <Stack data-testid="stack" gap="large">
        Content
      </Stack>
    );
    expect(screen.getByTestId('stack')).toHaveStyle({ gap: '24px' });

    rerender(
      <Stack data-testid="stack" gap="none">
        Content
      </Stack>
    );
    expect(screen.getByTestId('stack')).toHaveStyle({ gap: '0px' });
  });

  it('applies Beer CSS margin classes from margin prop', () => {
    const { rerender } = render(
      <Stack data-testid="stack" margin="small">
        Content
      </Stack>
    );
    expect(screen.getByTestId('stack')).toHaveClass('small-margin');

    rerender(
      <Stack data-testid="stack" margin="medium">
        Content
      </Stack>
    );
    expect(screen.getByTestId('stack')).toHaveClass('medium-margin');

    rerender(
      <Stack data-testid="stack" margin="large">
        Content
      </Stack>
    );
    expect(screen.getByTestId('stack')).toHaveClass('large-margin');

    rerender(
      <Stack data-testid="stack" margin="none">
        Content
      </Stack>
    );
    expect(screen.getByTestId('stack')).toHaveClass('no-margin');
  });

  it('binds Beer CSS padding classes from padding prop', () => {
    const { rerender } = render(
      <Stack data-testid="stack" padding="small">
        Content
      </Stack>
    );
    expect(screen.getByTestId('stack')).toHaveClass('small-padding');

    rerender(
      <Stack data-testid="stack" padding="medium">
        Content
      </Stack>
    );
    expect(screen.getByTestId('stack')).toHaveClass('medium-padding');

    rerender(
      <Stack data-testid="stack" padding="large">
        Content
      </Stack>
    );
    expect(screen.getByTestId('stack')).toHaveClass('large-padding');

    rerender(
      <Stack data-testid="stack" padding="none">
        Content
      </Stack>
    );
    expect(screen.getByTestId('stack')).toHaveClass('no-padding');
  });

  it('supports alignment, justification, wrap and custom element tag', () => {
    render(
      <Stack
        data-testid="stack"
        as="section"
        orientation="row"
        align="center"
        justify="space-between"
        wrap
        className="custom-class"
      >
        <span>A</span>
        <span>B</span>
      </Stack>
    );
    const el = screen.getByTestId('stack');
    expect(el.tagName.toLowerCase()).toBe('section');
    expect(el).toHaveClass('custom-class');
    expect(el).toHaveStyle({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    });
  });

  it('forwards ref correctly', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Stack ref={ref}>Ref test</Stack>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
