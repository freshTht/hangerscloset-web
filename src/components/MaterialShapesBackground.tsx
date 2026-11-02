import React from 'react';
import './MaterialShapesBackground.css';

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
    className={`hc-material-shapes-bg-hanger-icon ${className}`.trim()}
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
      className={`hc-material-shapes-bg-container ${active ? 'active' : ''}`.trim()}
      aria-hidden="true"
    >
      {/* Top-left corner decorative shape */}
      <div className="shape flower slow-rotate primary-container hc-material-shapes-bg-flower" />

      {/* Bottom-right corner decorative shape */}
      <div className="shape wavy-circle slow-rotate tertiary-container hc-material-shapes-bg-wavy" />

      {/* Centered Ambient Animated Swaying Hanger */}
      <div className="hc-material-shapes-bg-hanger-wrapper">
        <div className="hc-material-shapes-bg-hanger">
          <HangerIcon size={170} className="primary-text" />
        </div>
      </div>
    </div>
  );
};
