import React from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import './InventoryCardSkeleton.css';

export const InventoryCardSkeleton: React.FC = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <article
        className="no-padding round row no-space no-scroll border hc-card-skeleton-mobile"
        aria-hidden="true"
      >
        {/* Fixed 120px photo placeholder */}
        <div className="hc-skeleton left-round hc-card-skeleton-mobile-photo" />

        {/* Content Body placeholder */}
        <div className="padding vertical hc-card-skeleton-mobile-body">
          {/* Top Block: Code + Status Badge, Title */}
          <div>
            <div className="row no-margin hc-card-skeleton-mobile-header-row">
              <div className="hc-skeleton hc-card-skeleton-chip-code" />
              <div className="hc-skeleton hc-card-skeleton-chip-status" />
            </div>
            <div className="hc-skeleton hc-card-skeleton-title-1" />
            <div className="hc-skeleton hc-card-skeleton-title-2" />
          </div>

          {/* Bottom Block: Attributes + Prices */}
          <div className="hc-inventory-card-bottom-section">
            <div className="hc-skeleton hc-card-skeleton-attr-line" />
            <div className="hc-skeleton round hc-card-skeleton-price-block" />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="no-padding round vertical border hc-card-skeleton-desktop"
      aria-hidden="true"
    >
      {/* 1:1 Square top photo placeholder */}
      <div className="hc-skeleton top-round hc-card-skeleton-desktop-photo" />

      {/* Content body placeholder */}
      <div className="padding vertical hc-card-skeleton-desktop-body">
        <div className="hc-skeleton hc-card-skeleton-desktop-code" />
        <div className="hc-skeleton hc-card-skeleton-desktop-title-1" />
        <div className="hc-skeleton hc-card-skeleton-desktop-title-2" />

        <div className="hc-card-skeleton-desktop-attr-spacer">
          <div className="hc-skeleton hc-card-skeleton-desktop-attr" />
        </div>

        <div className="hc-card-skeleton-desktop-bottom">
          <div className="hc-skeleton round hc-card-skeleton-desktop-price-block" />
        </div>
      </div>
    </article>
  );
};
