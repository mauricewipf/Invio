import { DEFAULT_LOCALIZATION, resolveLocalization } from "$lib/i18n/mod";
import { desktopApiFetch, getDesktopSessionToken, isDesktopBuild } from "$lib/desktop";

export const ssr = false;

export const load = async () => {
  if (!isDesktopBuild()) return {};

  const token = getDesktopSessionToken();
  let localization = DEFAULT_LOCALIZATION;
  let user = null;
  let demoMode = false;
  let demoResetMinutes = null;

  try {
    const demoRes = await desktopApiFetch("/api/v1/demo-mode");
    if (demoRes.ok) {
      const demo = await demoRes.json();
      demoMode = Boolean(demo.demoMode);
      demoResetMinutes = demo.demoResetMinutes ?? null;
    }
  } catch {
    // Demo status is optional for the desktop shell.
  }

  if (!token) {
    return { user, localization, demoMode, demoResetMinutes };
  }

  const [settingsResult, userResult] = await Promise.allSettled([
    desktopApiFetch("/api/v1/settings"),
    desktopApiFetch("/api/v1/users/me"),
  ]);

  if (settingsResult.status === "fulfilled" && settingsResult.value.ok) {
    const settings = await settingsResult.value.json();
    localization = resolveLocalization(
      settings.locale,
      settings.numberFormat,
      settings.dateFormat,
      settings.postalCityFormat,
    );
  }

  if (userResult.status === "fulfilled" && userResult.value.ok) {
    user = await userResult.value.json();
  }

  return { user, localization, demoMode, demoResetMinutes };
};
