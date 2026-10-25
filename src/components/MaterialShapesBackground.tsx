import React from 'react';

interface MaterialShapesBackgroundProps {
  active?: boolean;
}

// Google Material Symbols 'checkroom' SVG vector (avoids font clipping issues)
const HangerIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 170,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ overflow: 'visible', display: 'block' }}
    aria-hidden="true"
  >
    <path d="M12 4c-1.1 0-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.5-.83 2.8-2 3.47V11l7.85 5.5c.7.49 1.15 1.3 1.15 2.22 0 1.53-1.25 2.78-2.78 2.78H3.78C2.25 21.5 1 20.25 1 18.72c0-.92.45-1.73 1.15-2.22L10 11V9.47C8.83 8.8 8 7.5 8 6H6c0 3.31 2.69 6 6 6v.83L4.2 18.25c-.13.09-.2.24-.2.47 0 .43.35.78.78.78h14.44c.43 0 .78-.35.78-.78 0-.23-.07-.38-.2-.47L12 12.83V12z" />
  </svg>
);

export const MaterialShapesBackground: React.FC<MaterialShapesBackgroundProps> = ({
  active = true,
}) => {
  return (
    <div
      className="material-shapes-bg-container"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: active ? 1 : 0,
        visibility: active ? 'visible' : 'hidden',
        transition: 'opacity 0.4s ease, visibility 0.4s ease',
      }}
      aria-hidden="true"
    >
      {/* Top-left corner decorative shape */}
      <div
        className="shape flower slow-rotate primary-container material-shapes-bg-flower"
        style={{
          position: 'absolute',
          top: '-4rem',
          left: '-4rem',
          width: '18rem',
          height: '18rem',
        }}
      />

      {/* Bottom-right corner decorative shape */}
      <div
        className="shape wavy-circle slow-rotate tertiary-container material-shapes-bg-wavy"
        style={{
          position: 'absolute',
          bottom: '-5rem',
          right: '-5rem',
          width: '20rem',
          height: '20rem',
        }}
      />

      {/* Centered Ambient Animated Swaying Hanger */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '50%',
          marginLeft: '-85px',
          width: '170px',
          height: '170px',
        }}
      >
        <div
          className="material-shapes-bg-hanger"
          style={{
            width: '100%',
            height: '100%',
            transformOrigin: '50% 8%',
            animation: 'hanger-sway 6s ease-in-out infinite',
          }}
        >
          <HangerIcon size={170} className="primary-text" />
        </div>
      </div>
    </div>
  );
};
