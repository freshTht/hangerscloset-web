import React from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { Skeleton } from './Skeleton';
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
        <Skeleton className="left-round hc-card-skeleton-mobile-photo" />

        {/* Content Body placeholder */}
        <div className="padding vertical hc-card-skeleton-mobile-body">
          {/* Top Block: Code + Status Badge, Title */}
          <div>
            <div className="row no-margin hc-card-skeleton-mobile-header-row">
              <Skeleton className="hc-card-skeleton-chip-code" />
              <Skeleton className="hc-card-skeleton-chip-status" />
            </div>
            <Skeleton className="hc-card-skeleton-title-1" />
            <Skeleton className="hc-card-skeleton-title-2" />
          </div>

          {/* Bottom Block: Attributes + Prices */}
          <div className="hc-inventory-card-bottom-section">
            <Skeleton className="hc-card-skeleton-attr-line" />
            <Skeleton shape="round" className="hc-card-skeleton-price-block" />
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
      <Skeleton className="top-round hc-card-skeleton-desktop-photo" />

      {/* Content body placeholder */}
      <div className="padding vertical hc-card-skeleton-desktop-body">
        <Skeleton className="hc-card-skeleton-desktop-code" />
        <Skeleton className="hc-card-skeleton-desktop-title-1" />
        <Skeleton className="hc-card-skeleton-desktop-title-2" />

        <div className="hc-card-skeleton-desktop-attr-spacer">
          <Skeleton className="hc-card-skeleton-desktop-attr" />
        </div>

        <div className="hc-card-skeleton-desktop-bottom">
          <Skeleton shape="round" className="hc-card-skeleton-desktop-price-block" />
        </div>
      </div>
    </article>
  );
};
