import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AVAILABLE_FONTS,
  APP_FONT_STORAGE_KEY,
  DEFAULT_FONT_ID,
  getSavedFontId,
  isFontLoaded,
  loadGoogleFont,
  applyFont,
  initFontPreference,
  resetFontForTesting,
} from '../fontManager';

describe('fontManager', () => {
  beforeEach(() => {
    resetFontForTesting();
    localStorage.clear();
    document.head.innerHTML = '';
  });

  afterEach(() => {
    resetFontForTesting();
    vi.restoreAllMocks();
  });

  it('defines the three curated fonts: Sarabun (default), IBM Plex Sans, and Playpen with preview images', () => {
    expect(AVAILABLE_FONTS).toHaveLength(3);
    expect(AVAILABLE_FONTS.map((f) => f.id)).toEqual([
      'sarabun',
      'ibm-plex-sans',
      'playpen',
    ]);

    const sarabun = AVAILABLE_FONTS[0];
    expect(sarabun.label).toBe('Sarabun');
    expect(sarabun.isDefault).toBe(true);
    expect(sarabun.googleFontName).toBe('Sarabun');
    expect(sarabun.previewImage).toBeTruthy();

    const ibmPlex = AVAILABLE_FONTS[1];
    expect(ibmPlex.label).toBe('IBM Plex Sans');
    expect(ibmPlex.googleFontName).toBe('IBM Plex Sans Thai');
    expect(ibmPlex.previewImage).toBeTruthy();

    const playpen = AVAILABLE_FONTS[2];
    expect(playpen.label).toBe('Playpen');
    expect(playpen.googleFontName).toBe('Playpen Sans Thai');
    expect(playpen.previewImage).toBeTruthy();
  });

  it('retrieves saved font id from localStorage with fallback to sarabun default', () => {
    expect(getSavedFontId()).toBe(DEFAULT_FONT_ID);
    expect(getSavedFontId()).toBe('sarabun');

    localStorage.setItem(APP_FONT_STORAGE_KEY, 'ibm-plex-sans');
    expect(getSavedFontId()).toBe('ibm-plex-sans');

    // Invalid font id falls back to sarabun
    localStorage.setItem(APP_FONT_STORAGE_KEY, 'unknown-font');
    expect(getSavedFontId()).toBe('sarabun');
  });

  it('lazy loads selected Google Font and injects preconnect links', async () => {
    const ibmFont = AVAILABLE_FONTS.find((f) => f.id === 'ibm-plex-sans')!;
    const loadPromise = loadGoogleFont(ibmFont);

    // Verify preconnect links were injected
    const preconnect1 = document.getElementById('hc-google-fonts-preconnect');
    const preconnect2 = document.getElementById('hc-google-fonts-preconnect-gstatic');
    expect(preconnect1).not.toBeNull();
    expect(preconnect2).not.toBeNull();

    // Verify font stylesheet link was created
    const fontLink = document.getElementById('hc-font-ibm-plex-sans') as HTMLLinkElement | null;
    expect(fontLink).not.toBeNull();
    expect(fontLink?.rel).toBe('stylesheet');
    expect(fontLink?.href).toContain('family=IBM+Plex+Sans+Thai');

    // Simulate link load event
    fontLink?.onload?.(new Event('load'));
    await loadPromise;

    expect(isFontLoaded('ibm-plex-sans')).toBe(true);
  });

  it('does not re-inject duplicate stylesheet links for already loaded fonts', async () => {
    const playpenFont = AVAILABLE_FONTS.find((f) => f.id === 'playpen')!;

    const firstPromise = loadGoogleFont(playpenFont);
    const link1 = document.getElementById('hc-font-playpen') as HTMLLinkElement;
    link1.onload?.(new Event('load'));
    await firstPromise;

    // Second call should resolve immediately and not add duplicate links
    await loadGoogleFont(playpenFont);
    const allPlaypenLinks = document.querySelectorAll('#hc-font-playpen');
    expect(allPlaypenLinks.length).toBe(1);
  });

  it('applies font style and saves choice in localStorage', async () => {
    const playpenFont = AVAILABLE_FONTS.find((f) => f.id === 'playpen')!;
    const applyPromise = applyFont('playpen');

    // Property set immediately
    expect(document.documentElement.style.getPropertyValue('--font')).toBe(playpenFont.fontFamily);
    expect(localStorage.getItem(APP_FONT_STORAGE_KEY)).toBe('playpen');

    const link = document.getElementById('hc-font-playpen') as HTMLLinkElement;
    link?.onload?.(new Event('load'));
    await applyPromise;

    expect(document.documentElement.style.getPropertyValue('--font')).toBe(playpenFont.fontFamily);
  });

  it('initializes font preference on startup defaulting to Sarabun', () => {
    initFontPreference();

    const sarabunFont = AVAILABLE_FONTS.find((f) => f.id === 'sarabun')!;
    expect(document.documentElement.style.getPropertyValue('--font')).toBe(sarabunFont.fontFamily);
    expect(document.getElementById('hc-font-sarabun')).not.toBeNull();
  });

  it('handles font load error gracefully without throwing', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sarabunFont = AVAILABLE_FONTS.find((f) => f.id === 'sarabun')!;

    const loadPromise = loadGoogleFont(sarabunFont);
    const link = document.getElementById('hc-font-sarabun') as HTMLLinkElement;
    link?.onerror?.('Network error');

    await expect(loadPromise).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
