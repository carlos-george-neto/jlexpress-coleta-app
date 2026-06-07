let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch("/api/auth/refresh", { method: "POST" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function redirectToLogin(): Promise<never> {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  window.location.href = "/login";
  throw new Error("Sessão expirada");
}

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);

  if (res.status !== 401) return res;

  const refreshed = await tryRefreshToken();
  if (!refreshed) return redirectToLogin();

  const retry = await fetch(url, options);
  if (retry.status === 401) return redirectToLogin();

  return retry;
}
