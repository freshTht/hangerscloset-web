import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PREDEFINED_COLORS,
  APP_COLOR_STORAGE_KEY,
  DEFAULT_THEME_COLOR,
  getSavedColor,
  applyThemeColor,
  initColorPreference,
  resetColorForTesting,
} from '../themeColorManager';

vi.mock('beercss', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

describe('themeColorManager', () => {
  beforeEach(() => {
    resetColorForTesting();
    localStorage.clear();
  });

  afterEach(() => {
    resetColorForTesting();
    vi.restoreAllMocks();
  });

  it('defines all 21 Beer CSS predefined palette colors', () => {
    expect(PREDEFINED_COLORS).toHaveLength(21);
    expect(DEFAULT_THEME_COLOR).toBe('#673ab7'); // Deep purple
    expect(PREDEFINED_COLORS.some((c) => c.hex === '#673ab7')).toBe(true);
    expect(PREDEFINED_COLORS.some((c) => c.hex === '#f44336')).toBe(true);
    expect(PREDEFINED_COLORS.some((c) => c.hex === '#4caf50')).toBe(true);
    expect(PREDEFINED_COLORS.some((c) => c.hex === '#000000')).toBe(true);
    expect(PREDEFINED_COLORS.some((c) => c.hex === '#ffffff')).toBe(true);
  });

  it('retrieves saved color from localStorage with fallback to default', () => {
    expect(getSavedColor()).toBe('#673ab7');

    localStorage.setItem(APP_COLOR_STORAGE_KEY, '#e91e63');
    expect(getSavedColor()).toBe('#e91e63');

    // Legacy default purple #6750a4 maps cleanly to deep-purple #673ab7
    localStorage.setItem(APP_COLOR_STORAGE_KEY, '#6750a4');
    expect(getSavedColor()).toBe('#673ab7');

    // Unknown color falls back to default
    localStorage.setItem(APP_COLOR_STORAGE_KEY, '#123456');
    expect(getSavedColor()).toBe('#673ab7');
  });

  it('applies color theme and persists to localStorage', async () => {
    await applyThemeColor('#4caf50');
    expect(localStorage.getItem(APP_COLOR_STORAGE_KEY)).toBe('#4caf50');
  });

  it('initializes color preference on startup', () => {
    localStorage.setItem(APP_COLOR_STORAGE_KEY, '#ff9800');
    initColorPreference();
    expect(getSavedColor()).toBe('#ff9800');
  });
});
