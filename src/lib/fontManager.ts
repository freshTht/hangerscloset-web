import fontSarabunImg from '../assets/fonts/font-sarabun.png';
import fontIbmPlexSansImg from '../assets/fonts/font-ibm-plex-sans.png';
import fontPlaypenImg from '../assets/fonts/font-playpen.png';

export interface FontOption {
  id: string;
  name: string;
  label: string;
  isDefault?: boolean;
  fontFamily: string;
  googleFontName: string;
  weights: number[];
  previewImage: string;
}

export const APP_FONT_STORAGE_KEY = 'app-font';
export const DEFAULT_FONT_ID = 'sarabun';

export const AVAILABLE_FONTS: FontOption[] = [
  {
    id: 'sarabun',
    name: 'Sarabun',
    label: 'Sarabun',
    isDefault: true,
    fontFamily: '"Sarabun", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    googleFontName: 'Sarabun',
    weights: [300, 400, 500, 600, 700],
    previewImage: fontSarabunImg,
  },
  {
    id: 'ibm-plex-sans',
    name: 'IBM Plex Sans',
    label: 'IBM Plex Sans',
    fontFamily:
      '"IBM Plex Sans Thai", "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    googleFontName: 'IBM Plex Sans Thai',
    weights: [300, 400, 500, 600, 700],
    previewImage: fontIbmPlexSansImg,
  },
  {
    id: 'playpen',
    name: 'Playpen',
    label: 'Playpen',
    fontFamily:
      '"Playpen Sans Thai", "Playpen Sans", -apple-system, BlinkMacSystemFont, cursive, sans-serif',
    googleFontName: 'Playpen Sans Thai',
    weights: [300, 400, 500, 600, 700],
    previewImage: fontPlaypenImg,
  },
];

const loadedFontIds = new Set<string>();

export function getSavedFontId(): string {
  try {
    const saved = localStorage.getItem(APP_FONT_STORAGE_KEY);
    if (saved && AVAILABLE_FONTS.some((f) => f.id === saved)) {
      return saved;
    }
    return DEFAULT_FONT_ID;
  } catch {
    return DEFAULT_FONT_ID;
  }
}

export function isFontLoaded(fontId: string): boolean {
  return loadedFontIds.has(fontId);
}

export function loadGoogleFont(font: FontOption): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  const googleFontName = font.googleFontName;
  if (!googleFontName) return Promise.resolve();

  // If already loaded in session or already has corresponding link in head
  if (loadedFontIds.has(font.id) || document.getElementById(`hc-font-${font.id}`)) {
    loadedFontIds.add(font.id);
    return Promise.resolve();
  }

  // Preconnect links for Google Fonts performance
  if (!document.getElementById('hc-google-fonts-preconnect')) {
    const preconnect1 = document.createElement('link');
    preconnect1.id = 'hc-google-fonts-preconnect';
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.id = 'hc-google-fonts-preconnect-gstatic';
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);
  }

  return new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.id = `hc-font-${font.id}`;
    link.rel = 'stylesheet';
    const weightsStr = font.weights.join(';');
    const familyParam = `${googleFontName.replace(/ /g, '+')}:wght@${weightsStr}`;
    link.href = `https://fonts.googleapis.com/css2?family=${familyParam}&display=swap`;

    link.onload = () => {
      loadedFontIds.add(font.id);
      if (document.fonts && document.fonts.load) {
        document.fonts
          .load(`16px "${googleFontName}"`)
          .then(() => resolve())
          .catch(() => resolve());
      } else {
        resolve();
      }
    };

    link.onerror = () => {
      console.warn(`[fontManager] Failed to load font: ${font.name}`);
      resolve(); // Graceful degradation to fallback font stack
    };

    document.head.appendChild(link);
  });
}

export async function applyFont(fontId: string): Promise<void> {
  if (typeof document === 'undefined') return;

  const font = AVAILABLE_FONTS.find((f) => f.id === fontId) || AVAILABLE_FONTS[0];

  try {
    localStorage.setItem(APP_FONT_STORAGE_KEY, font.id);
  } catch (err) {
    console.warn('[fontManager] Unable to save font preference to localStorage', err);
  }

  // Set CSS property immediately so font-family stack and fallbacks take effect
  document.documentElement.style.setProperty('--font', font.fontFamily);
  document.body.style.setProperty('--font', font.fontFamily);

  // Lazy load the selected Google Font
  await loadGoogleFont(font);

  // Re-apply to ensure the custom font is active
  document.documentElement.style.setProperty('--font', font.fontFamily);
  document.body.style.setProperty('--font', font.fontFamily);
}

export function initFontPreference(): void {
  const savedFontId = getSavedFontId();
  const font = AVAILABLE_FONTS.find((f) => f.id === savedFontId) || AVAILABLE_FONTS[0];
  applyFont(font.id);
}

export function resetFontForTesting(): void {
  loadedFontIds.clear();
  if (typeof document !== 'undefined') {
    document.documentElement.style.removeProperty('--font');
    document.body.style.removeProperty('--font');
    const existing = document.querySelectorAll(
      'link[id^="hc-font-"], link[id^="hc-google-fonts-"]'
    );
    existing.forEach((el) => el.remove());
  }
  try {
    localStorage.removeItem(APP_FONT_STORAGE_KEY);
  } catch {
    // Ignore in non-storage environments
  }
}
