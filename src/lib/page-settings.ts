import { IMAGES } from '../constants.js';
import type { NewPageSettingsRow, PageSettingsRow } from '../db/schema.js';

export const HOME_PAGE_SETTINGS_KEY = 'home';

export interface PageSettings {
  avatarImage: string;
  heroImageTop: string;
  heroImageMiddle: string;
  heroImageBottom: string;
}

export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  avatarImage: IMAGES.avatar,
  heroImageTop: IMAGES.abstractBottom,
  heroImageMiddle: IMAGES.abstractTop,
  heroImageBottom: IMAGES.abstractMiddle,
};

export function rowToPageSettings(row: PageSettingsRow | undefined | null): PageSettings {
  if (!row) {
    return DEFAULT_PAGE_SETTINGS;
  }

  return {
    avatarImage: row.avatarImage,
    heroImageTop: row.heroImageTop,
    heroImageMiddle: row.heroImageMiddle,
    heroImageBottom: row.heroImageBottom,
  };
}

export function pageSettingsToInsertValues(settings: PageSettings): NewPageSettingsRow {
  return {
    key: HOME_PAGE_SETTINGS_KEY,
    avatarImage: settings.avatarImage,
    heroImageTop: settings.heroImageTop,
    heroImageMiddle: settings.heroImageMiddle,
    heroImageBottom: settings.heroImageBottom,
  };
}
