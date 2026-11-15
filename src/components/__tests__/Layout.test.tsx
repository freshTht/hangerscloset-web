import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '../Layout';

describe('Layout Component', () => {
  it('renders Android 12 two-tone layout structure with black nav bars and scrollable main content', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/bookings']}>
        <Layout />
      </MemoryRouter>
    );

    // App shell container
    const appContainer = container.querySelector('.hc-app-container');
    expect(appContainer).toBeInTheDocument();

    // Side navigation rail for desktop/tablet
    const railNav = container.querySelector('nav.left');
    expect(railNav).toBeInTheDocument();
    expect(railNav).toHaveClass('m');
    expect(railNav).toHaveClass('l');

    // Mobile top app bar
    const mobileHeader = container.querySelector('header.hc-top-header');
    expect(mobileHeader).toBeInTheDocument();
    expect(mobileHeader).toHaveClass('s');

    // Navigation links are present in both
    expect(screen.getAllByText('การจอง').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('คลังชุด').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('การตั้งค่า').length).toBeGreaterThanOrEqual(2);

    // Main content area
    const main = container.querySelector('main.responsive');
    expect(main).toBeInTheDocument();
    expect(container.querySelector('.hc-page-content')).toBeInTheDocument();

    // Bottom gradient underlay for FABs
    expect(container.querySelector('.hc-bottom-gradient-underlay')).toBeInTheDocument();
  });
});
