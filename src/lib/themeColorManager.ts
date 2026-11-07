import ui from 'beercss';

export interface PredefinedColor {
  id: string;
  name: string;
  hex: string;
}

export const APP_COLOR_STORAGE_KEY = 'theme-color';

/**
 * 21 Predefined Material Design palette colors from Beer CSS (beercss.com):
 * Arranged in 3 rows × 7 columns:
 * Row 1: Red, Pink, Purple, Deep Purple, Indigo, Blue, Light Blue
 * Row 2: Cyan, Teal, Green, Light Green, Lime, Yellow, Amber
 * Row 3: Orange, Deep Orange, Brown, Grey, Blue-Grey, Black, White
 */
export const PREDEFINED_COLORS: PredefinedColor[] = [
  // Row 1: Red to Light Blue (7 cols)
  { id: 'red', name: 'แดง', hex: '#f44336' },
  { id: 'pink', name: 'ชมพู', hex: '#e91e63' },
  { id: 'purple', name: 'ม่วง', hex: '#9c27b0' },
  { id: 'deep-purple', name: 'ม่วงเข้ม', hex: '#673ab7' },
  { id: 'indigo', name: 'คราม', hex: '#3f51b5' },
  { id: 'blue', name: 'น้ำเงิน', hex: '#2196f3' },
  { id: 'light-blue', name: 'ฟ้า', hex: '#03a9f4' },

  // Row 2: Cyan to Amber (7 cols)
  { id: 'cyan', name: 'ฟ้าอมเขียว', hex: '#00bcd4' },
  { id: 'teal', name: 'เขียวหัวเป็ด', hex: '#009688' },
  { id: 'green', name: 'เขียว', hex: '#4caf50' },
  { id: 'light-green', name: 'เขียวอ่อน', hex: '#8bc34a' },
  { id: 'lime', name: 'มะนาว', hex: '#cddc39' },
  { id: 'yellow', name: 'เหลือง', hex: '#ffeb3b' },
  { id: 'amber', name: 'ส้มอำพัน', hex: '#ffc107' },

  // Row 3: Orange to White (7 cols)
  { id: 'orange', name: 'ส้ม', hex: '#ff9800' },
  { id: 'deep-orange', name: 'ส้มเข้ม', hex: '#ff5722' },
  { id: 'brown', name: 'น้ำตาล', hex: '#795548' },
  { id: 'grey', name: 'เทา', hex: '#9e9e9e' },
  { id: 'blue-grey', name: 'เทาอมน้ำเงิน', hex: '#607d8b' },
  { id: 'black', name: 'ดำ', hex: '#000000' },
  { id: 'white', name: 'ขาว', hex: '#ffffff' },
];

export const DEFAULT_THEME_COLOR = '#673ab7';

export function getSavedColor(): string {
  try {
    const saved = localStorage.getItem(APP_COLOR_STORAGE_KEY);
    if (saved) {
      const matched = PREDEFINED_COLORS.find((c) => c.hex.toLowerCase() === saved.toLowerCase());
      if (matched) {
        return matched.hex;
      }
      // Migrate legacy default M3 purple #6750a4 to deep-purple #673ab7
      if (saved.toLowerCase() === '#6750a4') {
        return DEFAULT_THEME_COLOR;
      }
    }
    return DEFAULT_THEME_COLOR;
  } catch {
    return DEFAULT_THEME_COLOR;
  }
}

export async function applyThemeColor(hex: string): Promise<void> {
  try {
    localStorage.setItem(APP_COLOR_STORAGE_KEY, hex);
  } catch (err) {
    console.warn('[themeColorManager] Unable to save theme-color to localStorage', err);
  }

  try {
    await ui('theme', hex);
  } catch (err) {
    console.warn('[themeColorManager] Failed to apply theme with ui("theme", hex):', err);
  }

  // Compute and set dark nav variables for persistent dark theme on nav bars
  try {
    const globalObj = globalThis as typeof globalThis & {
      materialDynamicColors?: (hex: string) => Promise<{
        dark?: {
          primary: string;
          onPrimary: string;
        };
      }>;
    };
    const mdc = globalObj.materialDynamicColors;
    if (typeof mdc === 'function') {
      const res = await mdc(hex);
      if (res?.dark && typeof document !== 'undefined') {
        const root = document.documentElement;
        root.style.setProperty('--hc-nav-primary', res.dark.primary);
        root.style.setProperty('--hc-nav-on-primary', res.dark.onPrimary);
      }
    }
  } catch {
    // Graceful fallback to CSS var(--inverse-primary)
  }
}

export function initColorPreference(): void {
  const savedColor = getSavedColor();
  if (savedColor) {
    applyThemeColor(savedColor);
  }
}

export function resetColorForTesting(): void {
  try {
    localStorage.removeItem(APP_COLOR_STORAGE_KEY);
    if (typeof document !== 'undefined') {
      document.documentElement.style.removeProperty('--hc-nav-primary');
      document.documentElement.style.removeProperty('--hc-nav-on-primary');
    }
  } catch {
    // Ignore in non-storage environments
  }
}
