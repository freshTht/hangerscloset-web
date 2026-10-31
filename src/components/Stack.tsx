import React, { forwardRef } from 'react';

export type BeerSpacing =
  | 'none'
  | 'tiny'
  | 'small'
  | 'medium'
  | 'large'
  | 'extra';

export type BeerPadding =
  | BeerSpacing
  | 'horizontal'
  | 'vertical'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right';

export type StackOrientation = 'row' | 'column';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: StackOrientation;
  gap?: BeerSpacing | number | string;
  margin?: BeerSpacing;
  padding?: BeerPadding;
  align?: React.CSSProperties['alignItems'];
  justify?: React.CSSProperties['justifyContent'];
  wrap?: boolean | React.CSSProperties['flexWrap'];
  as?: React.ElementType;
}

const PADDING_CLASS_MAP: Record<BeerPadding, string> = {
  none: 'no-padding',
  tiny: 'tiny-padding',
  small: 'small-padding',
  medium: 'medium-padding',
  large: 'large-padding',
  extra: 'extra-padding',
  horizontal: 'horizontal-padding',
  vertical: 'vertical-padding',
  top: 'top-padding',
  bottom: 'bottom-padding',
  left: 'left-padding',
  right: 'right-padding',
};

const MARGIN_CLASS_MAP: Record<BeerSpacing, string> = {
  none: 'no-margin',
  tiny: 'tiny-margin',
  small: 'small-margin',
  medium: 'medium-margin',
  large: 'large-margin',
  extra: 'extra-margin',
};

// Spacing in pixels matching Beer CSS scale (rhymes with beercss padding: 4px, 8px, 16px, 24px, 32px)
const GAP_PIXEL_MAP: Record<BeerSpacing, string> = {
  none: '0px',
  tiny: '4px',
  small: '8px',
  medium: '16px',
  large: '24px',
  extra: '32px',
};

const resolveGap = (gap?: BeerSpacing | number | string): string | undefined => {
  if (gap === undefined) return undefined;
  if (typeof gap === 'number') return `${gap}px`;
  if (gap in GAP_PIXEL_MAP) return GAP_PIXEL_MAP[gap as BeerSpacing];
  return gap;
};

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      orientation = 'column',
      gap,
      margin,
      padding,
      align,
      justify,
      wrap,
      as: Component = 'div',
      className,
      style,
      children,
      ...rest
    },
    ref
  ) => {
    const classes = [
      margin ? MARGIN_CLASS_MAP[margin] : undefined,
      padding ? PADDING_CLASS_MAP[padding] : undefined,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const stackStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: orientation,
      gap: resolveGap(gap),
      alignItems: align,
      justifyContent: justify,
      flexWrap: typeof wrap === 'boolean' ? (wrap ? 'wrap' : 'nowrap') : wrap,
      ...style,
    };

    return (
      <Component
        ref={ref}
        className={classes || undefined}
        style={stackStyle}
        {...rest}
      >
        {children}
      </Component>
    );
  }
);

Stack.displayName = 'Stack';
