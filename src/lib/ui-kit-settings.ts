import type { NewUiKitSettingsRow, UiKitSettingsRow } from '../db/schema.js';

export const UI_KIT_SETTINGS_KEY = 'ui-kit';

export interface UiKitSettings {
  screenshots: string[];
  previewVideoUrl: string;
  featuresVideoUrl: string;
  installVideoUrl: string;
}

const DEFAULT_SCREENSHOTS = [
  '/ui-kit/ui-kit-1.webp',
  '/ui-kit/ui-kit-2.webp',
  '/ui-kit/ui-kit-3.webp',
  '/ui-kit/ui-kit-4.webp',
  '/ui-kit/ui-kit-5.webp',
  '/ui-kit/ui-kit-6.webp',
];

export const DEFAULT_UI_KIT_SETTINGS: UiKitSettings = {
  screenshots: DEFAULT_SCREENSHOTS,
  previewVideoUrl: 'https://0nzst7ka0j.ufs.sh/f/octNiMKDR9jHqEs1tcXGt7SWNMR1XjvU0uJxB9pDIlaZqdb6',
  featuresVideoUrl: '',
  installVideoUrl: '',
};

/** Parse the JSON screenshots column defensively; fall back to defaults on any error. */
function parseScreenshotsJson(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_SCREENSHOTS;
    const urls = parsed.flatMap((item) => (typeof item === 'string' && item.trim() ? [item.trim()] : []));
    return urls.length ? urls : DEFAULT_SCREENSHOTS;
  } catch {
    return DEFAULT_SCREENSHOTS;
  }
}

export function rowToUiKitSettings(row: UiKitSettingsRow | undefined | null): UiKitSettings {
  if (!row) {
    return DEFAULT_UI_KIT_SETTINGS;
  }

  return {
    screenshots: parseScreenshotsJson(row.screenshotsJson),
    previewVideoUrl: row.previewVideoUrl,
    featuresVideoUrl: row.featuresVideoUrl,
    installVideoUrl: row.installVideoUrl,
  };
}

export function uiKitSettingsToInsertValues(settings: UiKitSettings): NewUiKitSettingsRow {
  return {
    key: UI_KIT_SETTINGS_KEY,
    screenshotsJson: JSON.stringify(settings.screenshots),
    previewVideoUrl: settings.previewVideoUrl,
    featuresVideoUrl: settings.featuresVideoUrl,
    installVideoUrl: settings.installVideoUrl,
  };
}
