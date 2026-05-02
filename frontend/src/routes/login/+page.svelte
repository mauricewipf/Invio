<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/state";
  import { getContext } from "svelte";
  import { enhance as kitEnhance } from "$app/forms";
  import { DESKTOP_BACKEND_URL, isDesktopBuild, setDesktopSessionToken } from "$lib/desktop";

  let { form } = $props();

  let t = getContext("i18n") as (key: string, params?: Record<string, string>) => string;

  let isLoading = $state(false);
  let desktopError = $state("");
  let desktopTwoFactor = $state<{
    username: string;
    twoFactorToken: string;
  } | null>(null);

  function enhanceIfServer(formElement: HTMLFormElement) {
    if (isDesktopBuild()) return {};

    return kitEnhance(formElement, () => {
      isLoading = true;
      return async ({ update }) => {
        await update();
        isLoading = false;
      };
    });
  }

  async function handleSubmit(event: SubmitEvent) {
    if (!isDesktopBuild()) return;

    event.preventDefault();
    desktopError = "";
    isLoading = true;

    const data = new FormData(event.currentTarget as HTMLFormElement);
    const username = String(data.get("username") || desktopTwoFactor?.username || "");
    const password = String(data.get("password") || "");
    const token = String(data.get("token") || "");
    const recoveryCode = String(data.get("recoveryCode") || "");

    try {
      let endpoint = "/api/v1/auth/login";
      let payload: Record<string, string> = { username, password };

      if (desktopTwoFactor) {
        endpoint = recoveryCode ? "/api/v1/auth/recover-2fa" : "/api/v1/auth/verify-2fa";
        payload = {
          twoFactorToken: desktopTwoFactor.twoFactorToken,
          ...(recoveryCode ? { recoveryCode } : { token }),
        };
      }

      const res = await fetch(`${DESKTOP_BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        desktopError = body.error || `${res.status} ${res.statusText}`;
        return;
      }

      if (body.twoFactorRequired && body.twoFactorToken) {
        desktopTwoFactor = { username, twoFactorToken: body.twoFactorToken };
        return;
      }

      if (!body.token) {
        desktopError = "Login response did not include a session token";
        return;
      }

      setDesktopSessionToken(body.token, Number(body.expiresIn || 3600));
      await invalidateAll();
      await goto("/dashboard", { replaceState: true, invalidateAll: true });
    } catch (error) {
      desktopError = error instanceof Error ? error.message : String(error);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="hero bg-base-200 min-h-[80vh]">
  <div class="hero-content w-full max-w-md flex-col">
    <div class="card bg-base-100 border-base-300 w-full shrink-0 border shadow-xl">
      <div class="card-body">
        <h2 class="mb-2 text-center text-2xl font-semibold">
          {t("Welcome to Invio")}
        </h2>
        {#if page.data.demoMode == true}
          <div role="alert" class="alert alert-info">
            <span class="text-center">
              Invio is running in demo mode, log in using the following username and password:
              <br class="mb-2" />
              Username: <span class="font-medium">demo</span>
              <br />
              Password: <span class="font-medium">demo</span>
            </span>
          </div>
        {/if}

        <form
          method="POST"
          action="?/login"
          enctype="multipart/form-data"
          onsubmit={handleSubmit}
          use:enhanceIfServer
        >
          {#if desktopError}
            <div class="alert alert-error mb-3">
              <span>{t(desktopError)}</span>
            </div>
          {:else if form?.error}
            <div class="alert alert-error mb-3">
              <span>{t(form.error, (form as any)?.errorParams)}</span>
            </div>
          {/if}

          {#if desktopTwoFactor}
            <input type="hidden" name="username" value={desktopTwoFactor.username} />
          {:else if form?.twoFactorRequired}
            <input type="hidden" name="twoFactorToken" value={form?.twoFactorToken ?? ""} />
            <input type="hidden" name="username" value={form?.username ?? ""} />
          {/if}

          {#if !form?.twoFactorRequired && !desktopTwoFactor}
            <div class="form-control">
              <label class="label" for="username">
                <span class="label-text">{t("Username")}</span>
              </label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder={t("Enter your username")}
                class="input input-bordered w-full"
                value={form?.username ?? ""}
                autocomplete="username"
                required
                disabled={isLoading}
              />
            </div>

            <div class="form-control mt-2">
              <label class="label" for="password">
                <span class="label-text">{t("Password")}</span>
              </label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder={t("Enter your password")}
                class="input input-bordered w-full"
                autocomplete="current-password"
                required
                disabled={isLoading}
              />
            </div>
          {:else}
            <div class="alert alert-info mb-2">
              <span>{t("Two-factor authentication required")}</span>
            </div>
            <div class="form-control">
              <label class="label" for="token">
                <span class="label-text">{t("2FA code")}</span>
              </label>
              <input id="token" type="text" name="token" placeholder={t("Enter 6-digit code")} class="input input-bordered w-full" inputmode="numeric" maxlength="6" disabled={isLoading} />
            </div>

            <div class="divider">{t("or")}</div>

            <div class="form-control mt-2">
              <label class="label" for="recoveryCode">
                <span class="label-text">{t("Recovery code")}</span>
              </label>
              <input id="recoveryCode" type="text" name="recoveryCode" placeholder={t("Enter recovery code")} class="input input-bordered w-full" autocomplete="one-time-code" disabled={isLoading} />
            </div>
          {/if}

          <div class="form-control mt-6">
            <button class="btn btn-primary w-full" type="submit" disabled={isLoading}>
              {#if isLoading}
                <span class="loading loading-spinner"></span>
              {/if}
              {t("Login")}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
