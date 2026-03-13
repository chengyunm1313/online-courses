import {
  getSiteSettingsFromStore,
  updateSiteSettingsInStore,
  type SiteSettingsInput,
  type SiteSettingsRecord,
} from "@/lib/d1-repository";

export type { SiteSettingsInput, SiteSettingsRecord };

export async function getSiteSettings() {
  return getSiteSettingsFromStore();
}

export async function updateSiteSettings(input: SiteSettingsInput) {
  return updateSiteSettingsInStore(input);
}
