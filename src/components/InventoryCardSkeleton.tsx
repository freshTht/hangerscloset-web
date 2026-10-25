import React from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

export const InventoryCardSkeleton: React.FC = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <article
        className="no-padding round row no-space no-scroll border"
        style={{
          minHeight: 160,
          display: 'flex',
          alignItems: 'stretch',
          position: 'relative',
        }}
        aria-hidden="true"
      >
        {/* Fixed 120px photo placeholder */}
        <div
          className="skeleton left-round"
          style={{
            width: 120,
            flexShrink: 0,
            alignSelf: 'stretch',
            minHeight: 160,
          }}
        />

        {/* Content Body placeholder */}
        <div
          className="padding vertical"
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 6,
          }}
        >
          {/* Top Block: Code + Status Badge, Title */}
          <div>
            <div
              className="row no-margin"
              style={{
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 4,
                marginBottom: 6,
              }}
            >
              <div
                className="skeleton"
                style={{ width: 48, height: 14, borderRadius: 4 }}
              />
              <div
                className="skeleton"
                style={{ width: 56, height: 20, borderRadius: 9999 }}
              />
            </div>
            <div
              className="skeleton"
              style={{ width: '85%', height: 16, borderRadius: 4, marginBottom: 4 }}
            />
            <div
              className="skeleton"
              style={{ width: '55%', height: 16, borderRadius: 4 }}
            />
          </div>

          {/* Bottom Block: Attributes + Prices */}
          <div style={{ marginTop: 'auto' }}>
            <div
              className="skeleton"
              style={{ width: '70%', height: 12, borderRadius: 4, marginBottom: 8 }}
            />
            <div
              className="skeleton round"
              style={{ width: '100%', height: 34, borderRadius: 8 }}
            />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="no-padding round vertical border"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      aria-hidden="true"
    >
      {/* 1:1 Square top photo placeholder */}
      <div
        className="skeleton top-round"
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
        }}
      />

      {/* Content body placeholder */}
      <div
        className="padding vertical"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          className="skeleton"
          style={{ width: 56, height: 14, borderRadius: 4 }}
        />
        <div
          className="skeleton"
          style={{ width: '90%', height: 18, borderRadius: 4 }}
        />
        <div
          className="skeleton"
          style={{ width: '60%', height: 18, borderRadius: 4 }}
        />

        <div style={{ marginTop: 4 }}>
          <div
            className="skeleton"
            style={{ width: '75%', height: 14, borderRadius: 4 }}
          />
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
          <div
            className="skeleton round"
            style={{ width: '100%', height: 42, borderRadius: 8 }}
          />
        </div>
      </div>
    </article>
  );
};
