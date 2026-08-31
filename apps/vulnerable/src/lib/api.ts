import { createApiClient } from "@demo/shared-ui";

// Same origin in the browser. No CSRF token getter is passed — this app does
// not use CSRF tokens (that is one of the demonstrated flaws).
export const api = createApiClient();
