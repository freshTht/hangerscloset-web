import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoogleSignInButton, getAuthErrorInfo } from '../GoogleSignInButton';

describe('GoogleSignInButton', () => {
  it('renders Google sign-in button correctly', () => {
    render(<GoogleSignInButton onClick={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: /เข้าสู่ระบบด้วย google/i })
    ).toBeInTheDocument();
  });

  it('triggers onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<GoogleSignInButton onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const handleClick = vi.fn();
    render(<GoogleSignInButton onClick={handleClick} disabled={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders cancellation message subtly when popup is closed by user', () => {
    render(
      <GoogleSignInButton
        onClick={vi.fn()}
        errorMessage="Firebase: Error (auth/popup-closed-by-user)."
      />
    );

    expect(screen.getByText('การเข้าสู่ระบบถูกยกเลิก')).toBeInTheDocument();
    expect(screen.getByText('info')).toBeInTheDocument();
  });

  it('renders generic error message cleanly without red container', () => {
    render(
      <GoogleSignInButton
        onClick={vi.fn()}
        errorMessage="Firebase: Error (auth/invalid-credential)."
      />
    );

    expect(screen.getByText('auth/invalid-credential')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('cleans error formatting correctly via getAuthErrorInfo', () => {
    expect(getAuthErrorInfo('auth/popup-closed-by-user').isCancellation).toBe(true);
    expect(getAuthErrorInfo('auth/popup-closed-by-user').message).toBe('การเข้าสู่ระบบถูกยกเลิก');
    expect(getAuthErrorInfo('auth/popup-blocked').message).toContain('บล็อกป๊อปอัป');
    expect(getAuthErrorInfo('auth/network-request-failed').message).toContain('การเชื่อมต่อขัดข้อง');
  });
});
