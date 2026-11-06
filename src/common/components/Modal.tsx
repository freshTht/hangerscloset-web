import React, { useEffect, useRef } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import './Modal.css';

export type ModalVariant = 'floating' | 'bottom-sheet';

export interface ModalProps {
  visible: boolean;
  variant?: ModalVariant;
  onClose: () => void;
  children: React.ReactNode;
  id?: string;
  className?: string;
  overlayClassName?: string;
  testId?: string;
  overlayTestId?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  desktopSideSheet?: boolean;
  dialogRef?: React.Ref<HTMLDialogElement>;
}

/**
 * Centralized Modal component for all dialogs and bottom/side sheets in Hanger's Closet.
 * Wraps Beer CSS dialog standards with accessible focus management, backdrop overlay,
 * and responsive variant handling ('floating' vs 'bottom-sheet').
 */
export const Modal: React.FC<ModalProps> = ({
  visible,
  variant = 'floating',
  onClose,
  children,
  id,
  className = '',
  overlayClassName = '',
  testId,
  overlayTestId,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  desktopSideSheet = true,
  dialogRef,
}) => {
  const isMobile = useIsMobile();
  const internalRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const setRef = (node: HTMLDialogElement | null) => {
    (internalRef as React.MutableRefObject<HTMLDialogElement | null>).current = node;
    if (typeof dialogRef === 'function') {
      dialogRef(node);
    } else if (dialogRef && 'current' in dialogRef) {
      (dialogRef as React.MutableRefObject<HTMLDialogElement | null>).current = node;
    }
  };

  // Focus restoration on close & initial focus on open
  useEffect(() => {
    if (visible) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => {
        if (!internalRef.current) return;
        const focusable = internalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          internalRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [visible]);

  // Focus trap & Escape key handler
  useEffect(() => {
    if (!visible || !internalRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (closeOnEscape) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (e.key === 'Tab') {
        const focusable = internalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, closeOnEscape, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const getVariantClasses = () => {
    if (variant === 'bottom-sheet') {
      if (isMobile) {
        return 'bottom s';
      }
      return desktopSideSheet ? 'right medium m l' : 'bottom';
    }
    // Floating centered dialog
    return 'hc-modal-dialog-floating';
  };

  const variantClass = getVariantClasses();
  const activeClass = visible ? 'active' : '';

  return (
    <>
      <div
        className={`overlay hc-modal-overlay ${activeClass} ${overlayClassName}`.trim()}
        onClick={handleOverlayClick}
        aria-hidden={!visible}
        data-testid={overlayTestId}
      />

      <dialog
        ref={setRef}
        id={id}
        open={visible}
        aria-hidden={!visible}
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        data-testid={testId}
        className={`${variantClass} ${activeClass} hc-modal-dialog ${className}`.trim()}
      >
        {children}
      </dialog>
    </>
  );
};
