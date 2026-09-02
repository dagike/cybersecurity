import { createApiClient } from "@demo/shared-ui";

// Reads the (non-HttpOnly) CSRF cookie and hands it to the client, which sends
// it as X-CSRF-Token on every state-changing request. The server checks that
// it matches the cookie (double-submit pattern).
function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export const api = createApiClient({
  getCsrfToken: () => readCookie("csrf"),
});
